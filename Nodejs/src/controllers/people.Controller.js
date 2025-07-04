const peopleService = require('../services/people.Service');
const { Log } = require("../models");

exports.getAll = async (req, res) => {
    try {
        const people = await peopleService.GetAll();
        return res.status(200).json(people); 
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
exports.getById = async (req, res) => {
    const { id } = req.params;
    try {
        console.log('Getting people by ID:', id);
        const people = await peopleService.GetById(id);
        console.log('People found:', people ? 'Yes' : 'No');
        if (!people) {
            return res.status(404).json({ error: 'People not found' });
        }
        return res.status(200).json(people);
    } catch (error) {
        console.error('Error in getById controller:', error);
        return res.status(500).json({ error: error.message });
    }
}
exports.create = async (req, res) => {
    const PersonData = req.body;
    try {
        const people = await peopleService.Create(PersonData);

        // Ghi log nếu là admin
        if (req.user && req.user.role === 'admin') {
            await Log.create({
                userId: req.user.id,
                action: `Admin tạo People mới: ${JSON.stringify(PersonData)}`,
                time: new Date()
            });
        }

        return res.status(201).json(people);
    } catch (error) {
        return res.status(500).json({ error: error.message }); 
    }
};

exports.update = async (req, res) => {
    const { id } = req.params; 
    const PersonData = req.body; 
    try {
        // Validate: name là bắt buộc
        if (!PersonData.name || typeof PersonData.name !== 'string' || PersonData.name.trim() === '') {
            return res.status(400).json({ error: 'Trường name là bắt buộc và phải là chuỗi.' });
        }
        // Validate: birthday nếu có thì phải là ngày hợp lệ
        if (PersonData.birthday && isNaN(Date.parse(PersonData.birthday))) {
            return res.status(400).json({ error: 'Trường birthday phải là ngày hợp lệ (YYYY-MM-DD).' });
        }
        const people = await peopleService.Update(id, PersonData);
        if (!people) {
            return res.status(404).json({ error: 'People not found' });
        }
        // Ghi log nếu là admin
        if (req.user && req.user.role === 'admin') {
            await Log.create({
                userId: req.user.id,
                action: `Admin cập nhật People ${id}: ${JSON.stringify(PersonData)}`,
                time: new Date()
            });
        }
        return res.status(200).json(people);
    } catch (error) {
        console.error('Error updating People:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    const { id } = req.params; 
    const { profile_url } = req.body; 
    try {
        const people = await peopleService.Update_Profile(id, profile_url);

        // Ghi log nếu là admin
        if (req.user && req.user.role === 'admin') {
            await Log.create({
                userId: req.user.id,
                action: `Admin cập nhật profile People ${id}: ${profile_url}`,
                time: new Date()
            });
        }

        return res.status(200).json(people);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    try {
        await peopleService.Delete(id);

        // Ghi log nếu là admin
        if (req.user && req.user.role === 'admin') {
            await Log.create({
                userId: req.user.id,
                action: `Admin xóa People ${id}`,
                time: new Date()
            });
        }

        return res.status(200).json({ message: "People deleted" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};