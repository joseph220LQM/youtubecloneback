const pool  = require('../../db/mongo');
const { ObjectId } = require('mongodb');


const getMyVideos = async (req, res) => {
    const { userId } = req.body;
    
    try {
        const userObjectId = new ObjectId(userId);  // Convertir el userId a ObjectId
        const videos = await pool.db('youtube').collection('videos').find({ userId: userObjectId }).toArray();
        
        res.status(200).json({videos});
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ status: "Error", message: "Error interno del servidor" });
    }
};

const getOtherVideos = async (req, res) => {
    const { userId } = req.body;

    try {
        const userObjectId = new ObjectId(userId); // Convertir el userId a ObjectId
        const videos = await pool.db('youtube').collection('videos').aggregate([
            { $match: { userId: { $ne: userObjectId } } }, // Excluir los videos del usuario actual
            {
                $lookup: {
                    from: 'users', // Colección a relacionar
                    localField: 'userId', // Campo en videos
                    foreignField: '_id', // Campo en users
                    as: 'uploaderInfo' // Alias para los datos relacionados
                }
            },
            {
                $unwind: '$uploaderInfo' // Desempaquetar el array resultante de $lookup
            },
            {
                $project: {
                    _id: 1,
                    location: 1,
                    title: 1,
                    timestamp: 1,
                    'uploaderInfo.nombre': 1 // Incluir solo los campos necesarios
                }
            }
        ]).toArray();

        res.status(200).json({ videos });
    } catch (error) {
        console.error('Error fetching other videos:', error);
        res.status(500).json({ status: "Error", message: "Error interno del servidor" });
    }
};



module.exports = { getMyVideos, getOtherVideos };
