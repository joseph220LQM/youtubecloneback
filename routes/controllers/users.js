const pool  = require('../../db/mongo');
const pools3  = require('../../db/s3');
const CryptoJS = require('crypto-js');
const moment = require('moment-timezone');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();


const upload = (bucketName) => 
  multer({
    storage: multerS3({
      s3: pools3,
      bucket: bucketName,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        // Obtenemos la extensión del archivo según su tipo MIME
        const extension = file.mimetype.split('/')[1];
        cb(null, `${file.fieldname}-${Date.now()}.${extension}`);
      },
    }),
    fileFilter: function (req, file, cb) {
      // Validamos si el archivo es una imagen o un video
      if (
        file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/')
      ) {
        cb(null, true); // Aceptar el archivo
      } else {
        cb(new Error('Sólo se permiten imágenes y videos'), false); // Rechazar el archivo
      }
    },
  });

//---------------Login---------------------

const validateCredentials = async (req, res) => {
    const datos = req.body;
    //console.log("LOGIN: ", datos)
    const hashedPassword = CryptoJS.SHA256(datos.password, process.env.CODE_SECRET_DATA).toString();
    try{
      const login =  await pool.db('youtube').collection('users').findOne({ email: datos.email, pass: hashedPassword });
      if (login) {
        // Obtener la fecha y hora actual en formato Bogotá
        const currentDateTime = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
        // Almacenar en la colección log_login
        await pool.db('youtube').collection('log_login').insertOne({ email: datos.email, role: login.role, date: currentDateTime });
        res.json({ status: "Bienvenido", user: datos.email, role: login.role, _id: login._id, nombre: login.nombre});
      } else {
        res.json({ status: "ErrorCredenciales" });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ status: "Error", message: "Internal Server Error" });
    }
  };

  const Signup = async (req, res) => {
    const datos = req.body;
    const hashedPassword = CryptoJS.SHA256(datos.password, process.env.CODE_SECRET_DATA).toString();
    
    try {
        const userFind = await pool.db('youtube').collection('users').findOne({ email: datos.email });
        if (userFind) {
            res.status(409).json({ message: `El usuario con el correo: ${datos.email} ya está creado` });
        } else {
            await pool.db('youtube').collection('users').insertOne({ email: datos.email, pass: hashedPassword, nombre: datos.username, role: datos.role });
            res.status(201).json({ message: `Usuario creado exitosamente` });
        }
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ message: 'Error al crear el usuario' });
    }
  }

  const Profile = (req, res) => {
    const uploadSingle = upload("videobucketjl").single("file");
    uploadSingle(req, res, async (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });

      const { userId, title } = req.body;
      const uploadedFile = req.file; // Ahora estará en req.file
      const currentDateTime = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
      const userObjectId = new ObjectId(userId);

      try {
        const result = await pool.db("youtube").collection("videos").insertOne({userId: userObjectId, title: title, location: uploadedFile.location, timestamp: currentDateTime});
        res.status(200).json({
          success: true,
          video: {
            _id: result.insertedId,
            userId: userObjectId,
            title: title,
            location: uploadedFile.location,
            timestamp: currentDateTime
          },
        });
      } catch (error) {
        console.error('Error al insertar el video:', error);
        res.status(500).json({ success: false, message: 'Error al insertar el video' });
      }
    });
  }
  module.exports = { validateCredentials, Signup, Profile };