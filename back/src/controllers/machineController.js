const { Machine, MachineNode, MachineConnection, Tool, Engine, Visor, JsonSchema, AiProvider } = require('../models');
const { executeSingleTool } = require('../utils/aiExecutor');
const { executeEngine } = require('../utils/engineExecutor');
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
                        { model: Engine, attributes: ['id', 'nombre', 'icono', 'tipo', 'descripcion'] },
                        { model: Visor, attributes: ['id', 'nombre', 'icono', 'descripcion'] }
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
                    visor_id: node.visor_id || null,
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
                        { model: Engine, attributes: ['id', 'nombre', 'icono', 'tipo', 'descripcion'] },
                        { model: Visor, attributes: ['id', 'nombre', 'icono', 'descripcion'] }
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
    const isStream = req.query.stream === 'true';

    // Set SSE headers if stream
    if (isStream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        // Send initial connect event
        res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    }

    const sendError = (status, msg, data = null) => {
        if (isStream) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: msg, data })}\n\n`);
            res.end();
        } else {
            const resp = { success: false, message: msg };
            if (data) resp.data = data;
            res.status(status).json(resp);
        }
    };

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
                        { model: Engine },
                        { model: Visor }
                    ]
                },
                { model: MachineConnection }
            ]
        });

        if (!machine) return sendError(404, 'Machine not found');

        const allNodes = machine.MachineNodes || [];
        const allConns = machine.MachineConnections || [];

        if (allNodes.length === 0) {
            return sendError(400, 'Machine has no nodes to execute.');
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
            return sendError(400, 'Machine graph contains a cycle. Cannot execute.');
        }

        // 4. Build node lookup
        const nodeMap = {};
        for (const n of allNodes) nodeMap[n.id] = n;

        // 5. Execute in topological order
        const nodeOutputs = {}; // nodeId → output data
        const userPrompt = req.body.prompt || null;

        for (const nodeId of executionOrder) {
            const node = nodeMap[nodeId];
            const stepStart = Date.now();

            if (isStream) {
                res.write(`data: ${JSON.stringify({ type: 'node-start', nodeId })}\n\n`);
            }

            const nodeName = node.Tool?.nombre || node.Engine?.nombre || node.Visor?.nombre || 'Unknown';
            const nodeIcon = node.Tool?.logo_herramienta || node.Engine?.icono || node.Visor?.icono || '❓';

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
                    // ── Engine Node: execute pure code logic ──
                    const engineResult = await executeEngine(node, inputText, parentOutputs, { nodeMap, adjacency });

                    nodeOutputs[nodeId] = engineResult.output;
                    step.output = engineResult.stepInfo;

                    // Support for engines that consume/handle other nodes (like list-iterator)
                    if (engineResult.consumedNodeId) {
                        nodeOutputs[engineResult.consumedNodeId] = engineResult.consumedOutput;
                    }

                } else if (node.node_type === 'visor' && node.Visor) {
                    // ── Visor Node: passthrough for visual feedback ──
                    nodeOutputs[nodeId] = inputText;
                    step.output = inputText;
                    step.visorSlug = node.Visor.slug;
                } else {
                    // Node with missing Tool/Engine/Visor reference — pass through
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
            if (!alreadyAdded) {
                steps.push(step);
                if (isStream) {
                    res.write(`data: ${JSON.stringify({ type: 'node-end', step })}\n\n`);
                }
            }
        }

        // Cleanup temp file
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
        }

        // 6. Determine final output (last node in execution order)
        const lastNodeId = executionOrder[executionOrder.length - 1];
        const finalOutput = nodeOutputs[lastNodeId];
        const responseData = {
            machine: { id: machine.id, nombre: machine.nombre, icono: machine.icono },
            steps,
            finalOutput,
            totalDuration: Date.now() - globalStart
        };

        if (isStream) {
            res.write(`data: ${JSON.stringify({ type: 'machine-end', data: responseData })}\n\n`);
            res.end();
        } else {
            res.json({ success: true, data: responseData });
        }

    } catch (error) {
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
        }
        console.error('Machine Execution Error:', error.message);
        sendError(500, `Machine Execution Failed: ${error.message}`, { steps, totalDuration: Date.now() - globalStart });
    }
};
