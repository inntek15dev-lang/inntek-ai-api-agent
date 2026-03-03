const { Machine, MachineNode, MachineConnection, Tool, Engine, JsonSchema, AiProvider } = require('../models');
const { executeSingleTool } = require('../utils/aiExecutor');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════
// Machine CRUD
// ═══════════════════════════════════════════════════════════════

exports.getMachines = async (req, res) => {
    try {
        const machines = await Machine.findAll({
            include: [{ model: MachineNode, attributes: ['id', 'node_type'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: machines });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMachine = async (req, res) => {
    try {
        const machine = await Machine.findByPk(req.params.id, {
            include: [
                {
                    model: MachineNode,
                    include: [
                        { model: Tool, attributes: ['id', 'nombre', 'logo_herramienta', 'descripcion'] },
                        { model: Engine, attributes: ['id', 'nombre', 'icono', 'tipo', 'descripcion'] }
                    ]
                },
                {
                    model: MachineConnection,
                    include: [
                        { model: MachineNode, as: 'SourceNode', attributes: ['id'] },
                        { model: MachineNode, as: 'TargetNode', attributes: ['id'] }
                    ]
                }
            ]
        });
        if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });
        res.json({ success: true, data: machine });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createMachine = async (req, res) => {
    try {
        const { nombre, descripcion, icono } = req.body;
        const machine = await Machine.create({ nombre, descripcion, icono });
        res.json({ success: true, data: machine });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateMachine = async (req, res) => {
    try {
        const machine = await Machine.findByPk(req.params.id);
        if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });

        const { nombre, descripcion, icono, activo, nodes, connections } = req.body;

        // Update machine metadata
        await machine.update({ nombre, descripcion, icono, activo });

        // If graph data is provided, replace the entire graph
        if (nodes !== undefined && connections !== undefined) {
            // Delete existing graph
            await MachineConnection.destroy({ where: { machine_id: machine.id } });
            await MachineNode.destroy({ where: { machine_id: machine.id } });

            // Create a map from client temp IDs to real DB IDs
            const nodeIdMap = {};

            // Create new nodes
            for (const node of nodes) {
                const created = await MachineNode.create({
                    id: node.id, // preserve client-provided UUID
                    machine_id: machine.id,
                    node_type: node.node_type,
                    tool_id: node.tool_id || null,
                    engine_id: node.engine_id || null,
                    position_x: node.position_x,
                    position_y: node.position_y,
                    config: node.config ? JSON.stringify(node.config) : null
                });
                nodeIdMap[node.id] = created.id;
            }

            // Create new connections
            for (const conn of connections) {
                await MachineConnection.create({
                    machine_id: machine.id,
                    source_node_id: nodeIdMap[conn.source_node_id] || conn.source_node_id,
                    target_node_id: nodeIdMap[conn.target_node_id] || conn.target_node_id,
                    source_handle: conn.source_handle || null,
                    target_handle: conn.target_handle || null
                });
            }
        }

        // Reload with full graph
        const updated = await Machine.findByPk(machine.id, {
            include: [
                {
                    model: MachineNode,
                    include: [
                        { model: Tool, attributes: ['id', 'nombre', 'logo_herramienta', 'descripcion'] },
                        { model: Engine, attributes: ['id', 'nombre', 'icono', 'tipo', 'descripcion'] }
                    ]
                },
                { model: MachineConnection }
            ]
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteMachine = async (req, res) => {
    try {
        const machine = await Machine.findByPk(req.params.id);
        if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });

        // Cascade: connections first, then nodes, then machine
        await MachineConnection.destroy({ where: { machine_id: machine.id } });
        await MachineNode.destroy({ where: { machine_id: machine.id } });
        await machine.destroy();

        res.json({ success: true, message: 'Machine deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// Machine Execution — DAG Traversal Engine
// ═══════════════════════════════════════════════════════════════

exports.executeMachine = async (req, res) => {
    const globalStart = Date.now();
    const steps = [];

    try {
        // 1. Load full graph with deep Tool relations
        const machine = await Machine.findByPk(req.params.id, {
            include: [
                {
                    model: MachineNode,
                    include: [
                        {
                            model: Tool,
                            include: [
                                { model: JsonSchema },
                                { model: AiProvider }
                            ]
                        },
                        { model: Engine }
                    ]
                },
                { model: MachineConnection }
            ]
        });

        if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });

        const allNodes = machine.MachineNodes || [];
        const allConns = machine.MachineConnections || [];

        if (allNodes.length === 0) {
            return res.status(400).json({ success: false, message: 'Machine has no nodes to execute.' });
        }

        // 2. Build adjacency & in-degree maps
        const adjacency = {};   // nodeId → [targetNodeIds]
        const inDegree = {};    // nodeId → number of incoming edges
        const incomingFrom = {}; // nodeId → [sourceNodeIds]

        for (const n of allNodes) {
            adjacency[n.id] = [];
            inDegree[n.id] = 0;
            incomingFrom[n.id] = [];
        }

        for (const c of allConns) {
            adjacency[c.source_node_id].push(c.target_node_id);
            inDegree[c.target_node_id] = (inDegree[c.target_node_id] || 0) + 1;
            incomingFrom[c.target_node_id].push(c.source_node_id);
        }

        // 3. Topological sort (Kahn's algorithm)
        const queue = [];
        for (const n of allNodes) {
            if (inDegree[n.id] === 0) queue.push(n.id);
        }

        const executionOrder = [];
        while (queue.length > 0) {
            const nodeId = queue.shift();
            executionOrder.push(nodeId);
            for (const target of adjacency[nodeId]) {
                inDegree[target]--;
                if (inDegree[target] === 0) queue.push(target);
            }
        }

        if (executionOrder.length !== allNodes.length) {
            return res.status(400).json({ success: false, message: 'Machine graph contains a cycle. Cannot execute.' });
        }

        // 4. Build node lookup
        const nodeMap = {};
        for (const n of allNodes) nodeMap[n.id] = n;

        // 5. Execute in topological order
        const nodeOutputs = {}; // nodeId → output data
        const userPrompt = req.body.prompt || 'Process the data.';

        for (const nodeId of executionOrder) {
            const node = nodeMap[nodeId];
            const stepStart = Date.now();
            const nodeName = node.Tool?.nombre || node.Engine?.nombre || 'Unknown';
            const nodeIcon = node.Tool?.logo_herramienta || node.Engine?.icono || '❓';

            const step = {
                nodeId: node.id,
                nodeName,
                nodeIcon,
                nodeType: node.node_type,
                engineType: node.Engine?.tipo || null,
                status: 'running',
                output: null,
                error: null,
                duration: 0
            };

            try {
                // Gather inputs from all parent nodes
                const parentOutputs = incomingFrom[nodeId].map(pid => nodeOutputs[pid]).filter(Boolean);
                const inputText = parentOutputs.length > 0
                    ? (typeof parentOutputs[0] === 'string' ? parentOutputs[0] : JSON.stringify(parentOutputs.length === 1 ? parentOutputs[0] : parentOutputs))
                    : userPrompt;

                if (node.node_type === 'tool' && node.Tool) {
                    // ── Tool Node: execute AI ──
                    const file = (parentOutputs.length === 0 && req.file) ? req.file : null;
                    const result = await executeSingleTool(node.Tool, inputText, file);
                    nodeOutputs[nodeId] = result.response;
                    step.output = result.response;
                    step.provider = result.provider;

                } else if (node.node_type === 'engine' && node.Engine) {
                    const engineSlug = node.Engine.slug;

                    if (engineSlug === 'list-iterator') {
                        // ── List Iterator: unpack array, exec next tool per item ──
                        let items = inputText;
                        if (typeof items === 'string') {
                            try { items = JSON.parse(items); } catch (e) { items = [items]; }
                        }
                        // If it's an object with an array property, find it
                        if (!Array.isArray(items) && typeof items === 'object') {
                            const arrayKey = Object.keys(items).find(k => Array.isArray(items[k]));
                            items = arrayKey ? items[arrayKey] : [items];
                        }
                        if (!Array.isArray(items)) items = [items];

                        // Find the next connected tool node
                        const targetIds = adjacency[nodeId];
                        const nextToolNode = targetIds.map(id => nodeMap[id]).find(n => n.node_type === 'tool' && n.Tool);

                        if (nextToolNode) {
                            const iterResults = [];
                            for (let i = 0; i < items.length; i++) {
                                const itemText = typeof items[i] === 'string' ? items[i] : JSON.stringify(items[i]);
                                const r = await executeSingleTool(nextToolNode.Tool, itemText);
                                iterResults.push(r.response);
                            }
                            nodeOutputs[nodeId] = iterResults;
                            // Also set the output for the next tool node so it's marked as done
                            nodeOutputs[nextToolNode.id] = iterResults;
                            step.output = { itemsProcessed: items.length, results: iterResults };
                        } else {
                            nodeOutputs[nodeId] = items;
                            step.output = items;
                        }

                    } else if (engineSlug === 'list-collector') {
                        // ── List Collector: aggregate all incoming outputs into array ──
                        const collected = [];
                        for (const po of parentOutputs) {
                            if (Array.isArray(po)) collected.push(...po);
                            else collected.push(po);
                        }
                        nodeOutputs[nodeId] = collected;
                        step.output = { collectedItems: collected.length, data: collected };

                    } else if (engineSlug === 'data-mapper') {
                        // ── Data Mapper: merge all incoming data ──
                        if (parentOutputs.length === 1) {
                            nodeOutputs[nodeId] = parentOutputs[0];
                        } else {
                            const merged = {};
                            for (const po of parentOutputs) {
                                if (typeof po === 'object' && !Array.isArray(po)) {
                                    Object.assign(merged, po);
                                } else if (Array.isArray(po)) {
                                    merged.data = [...(merged.data || []), ...po];
                                } else {
                                    merged.raw = (merged.raw || '') + '\n' + String(po);
                                }
                            }
                            nodeOutputs[nodeId] = merged;
                        }
                        step.output = nodeOutputs[nodeId];

                    } else {
                        // Unknown engine — pass through
                        nodeOutputs[nodeId] = inputText;
                        step.output = inputText;
                    }
                } else {
                    // Node with missing Tool/Engine reference — pass through
                    nodeOutputs[nodeId] = inputText;
                    step.output = inputText;
                }

                step.status = 'done';
            } catch (err) {
                step.status = 'error';
                step.error = err.message;
                nodeOutputs[nodeId] = null;
            }

            step.duration = Date.now() - stepStart;

            // Skip adding duplicate step for tool nodes already executed by list-iterator
            const alreadyAdded = steps.find(s => s.nodeId === nodeId);
            if (!alreadyAdded) steps.push(step);
        }

        // Cleanup temp file
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
        }

        // 6. Determine final output (last node in execution order)
        const lastNodeId = executionOrder[executionOrder.length - 1];
        const finalOutput = nodeOutputs[lastNodeId];

        res.json({
            success: true,
            data: {
                machine: { id: machine.id, nombre: machine.nombre, icono: machine.icono },
                steps,
                finalOutput,
                totalDuration: Date.now() - globalStart
            }
        });
    } catch (error) {
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
        }
        console.error('Machine Execution Error:', error.message);
        res.status(500).json({
            success: false,
            message: `Machine Execution Failed: ${error.message}`,
            data: { steps, totalDuration: Date.now() - globalStart }
        });
    }
};
