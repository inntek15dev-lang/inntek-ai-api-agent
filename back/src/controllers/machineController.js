const { Machine, MachineNode, MachineConnection, Tool, Engine } = require('../models');

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
