const express = require('express');
const router = express.Router();
const requestIp = require('request-ip');
const useragent = require('useragent');
const { v4: uuidv4 } = require('uuid'); // Import the uuid package
const QRCode = require('qrcode');
const path  = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function createQRCodeWithIcon(dataForQRcode, centerImagePath, qrCodeSize = 500, iconSize = 100) {
    // Create a canvas
    const canvas = createCanvas(qrCodeSize, qrCodeSize);
    const ctx = canvas.getContext('2d');

    // Generate QR code on the canvas
    await QRCode.toCanvas(canvas, dataForQRcode, {
        errorCorrectionLevel: 'H', // High error correction to accommodate the icon
        margin: 2,
        width: qrCodeSize,
        color: {
            dark: '#000000',
            light: '#ffffff',
        },
    });

    // Load the center icon image
    const icon = await loadImage(centerImagePath);

    // Calculate the position to center the icon
    const iconX = (qrCodeSize - iconSize) / 2;
    const iconY = (qrCodeSize - iconSize) / 2;

    // Draw the icon onto the center of the QR code
    ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);

    // Return the QR code image as a buffer
    return canvas.toBuffer();
}
  

// Middleware to log requests
router.use((req, res, next) => {
    console.log(`middleware! router - ${req.method} ${req.url}`);
    next();
});
// Define the GET endpoint
router.route('/').get(async (req, res, next) => {
    try {
        res.json('Tracking Link APIs');
    } catch (error) {
        next(error);
    }
});

const Visit = require('./model/visit.js');
const Store = require('./model/store.js');

// router.get('/track/:storeId', async (req, res, next) => {
//     try {
//         const { storeId } = req.params;
//         const { redirectUrl } = req.params;
//         const ipAddress = requestIp.getClientIp(req);
//         const agent = useragent.parse(req.headers['user-agent']);
//         const browser = agent.toAgent();
//         const os = agent.os.toString();
//         const device = agent.device.toString();
//         const userAgent = req.headers['user-agent'];

//         // Function to get the current visit time and adjust for time zone
//         const visitTime = () => {
//             const now = new Date();
//             now.setHours(now.getHours() + 7);
//             return now;
//         };
//         const currentVisitTime = visitTime().toLocaleString();
//         let storeVisit = await Visit.findOne({ storeId });

//         if (!storeVisit) {
//             storeVisit = new Visit({
//                 storeId,
//                 visitCount: 1,
//                 lastVisited: visitTime(),
//                 visitTimes: [currentVisitTime],
//                 ipAddress,
//                 userAgent: [userAgent], // Initialize as an array with the current userAgent
//                 browser,
//                 os,
//                 device,
//                 uniqueVisitors: [ipAddress],
//             });
//         } else {
//             storeVisit.visitCount += 1;
//             storeVisit.visitTimes.push(currentVisitTime); // Add the formatted visit time
//             storeVisit.lastVisited = visitTime();
//             storeVisit.ipAddress = ipAddress;
//             storeVisit.browser = browser;
//             storeVisit.os = os;
//             storeVisit.device = device;

//             // Ensure uniqueVisitors is defined and is an array
//             if (!Array.isArray(storeVisit.uniqueVisitors)) {
//                 storeVisit.uniqueVisitors = [];
//             }

//             // Check if the IP address is already in the uniqueVisitors array
//             if (!storeVisit.uniqueVisitors.includes(ipAddress)) {
//                 storeVisit.uniqueVisitors.push(ipAddress);
//             }
//             // Add the current userAgent to the array
//             storeVisit.userAgent.push(userAgent);
//         }
//         await storeVisit.save();
//         res.send(`Visit tracked datetime: ${currentVisitTime} | storeid: ${storeId}`);
//     } catch (error) {
//         next(error);
//     }
// });

router.get('/track/:storeId', async (req, res, next) => {
    try {
        const { storeId } = req.params;
        const { redirectUrl } = req.query; // Get redirect URL from the query parameter
        const ipAddress = requestIp.getClientIp(req);
        const agent = useragent.parse(req.headers['user-agent']);
        const browser = agent.toAgent();
        const os = agent.os.toString();
        const device = agent.device.toString();
        const userAgent = req.headers['user-agent'];

        // Function to get the current visit time and adjust for time zone
        const visitTime = () => {
            const now = new Date();
            now.setHours(now.getHours() + 7); // Adjust timezone if necessary
            return now;
        };
        const currentVisitTime = visitTime().toLocaleString();
        let storeVisit = await Visit.findOne({ storeId });

        if (!storeVisit) {
            storeVisit = new Visit({
                storeId,
                visitCount: 1,
                lastVisited: visitTime(),
                visitTimes: [currentVisitTime],
                ipAddress,
                userAgent: [userAgent],
                browser,
                os,
                device,
                uniqueVisitors: [ipAddress],
            });
        } else {
            storeVisit.visitCount += 1;
            storeVisit.visitTimes.push(currentVisitTime);
            storeVisit.lastVisited = visitTime();
            storeVisit.ipAddress = ipAddress;
            storeVisit.browser = browser;
            storeVisit.os = os;
            storeVisit.device = device;

            if (!Array.isArray(storeVisit.uniqueVisitors)) {
                storeVisit.uniqueVisitors = [];
            }

            if (!storeVisit.uniqueVisitors.includes(ipAddress)) {
                storeVisit.uniqueVisitors.push(ipAddress);
            }
            storeVisit.userAgent.push(userAgent);
        }
        await storeVisit.save();
        
        // Redirect to the provided URL after tracking
        if (redirectUrl) {
            return res.redirect(redirectUrl);
        }

        res.send(`Visit tracked datetime: ${currentVisitTime} | storeid: ${storeId}`);
    } catch (error) {
        next(error);
    }
});



// API to list all visits
router.get('/visits', async (req, res, next) => {
    try {
        const data = await Visit.find({});
        if (data == null || data.length === 0) {
            res.status(404).json({
              status: false,
              message: 'No visits found',
              totalResult: null,
              data: data,
            });
          } else {
            res.status(200).json({
              status: true,
              message: 'List visits retrieved successfully',
              totalResult: data.length,
              data: data
            });
        }
    } catch (error) {
        next(error);
    }
});






// Endpoint to list all stores
router.get('/stores', async (req, res, next) => {
    try {
        const data = await Store.find({});
        if (data == null || data.length === 0) {
            res.status(404).json({
              status: false,
              message: 'No stores found',
              totalResult: null,
              data: data,
            });
          } else {
            res.status(200).json({
              status: true,
              message: 'List stores retrieved successfully',
              totalResult: data.length,
              data: data,
            });
        }
    } catch (error) {
        next(error);
    }
});



// Endpoint to delete a store by storeId
router.delete('/store/:storeId', async (req, res, next) => {
    try {
        const { storeId } = req.params;

        const store = await Store.findOneAndDelete({ storeId });
        if (!store) {
            return res.status(404).json({ error: 'Store not found.' });
        }

        res.json({ message: 'Store deleted successfully!' });
    } catch (error) {
        next(error);
    }
});

// Endpoint to create a new store
router.post('/store', async (req, res, next) => {
    try {
        const { name, address, info } = req.body;

        // Generate a UUID for storeId
        const storeId = uuidv4();

        // Check if storeId already exists
        const existingStore = await Store.findOne({ storeId });
        if (existingStore) {
            return res.status(400).json({ error: 'Store with this ID already exists.' });
        }

        // Create a new store
        const store = new Store({ name, address, info, storeId });
        await store.save();

        res.status(201).json({ message: 'Store created successfully!', store });
    } catch (error) {
        next(error);
    }
});






// Endpoint to delete a store by storeId
router.delete('/track/:visitId', async (req, res, next) => {
    try {
        const { visitId } = req.params;

        const visit = await Visit.findOneAndDelete({ visitId });
        if (!visit) {
            return res.status(404).json({ error: 'Tracking not found.' });
        }

        res.json({ message: 'Tracking deleted successfully!' });
    } catch (error) {
        next(error);
    }
});



// API to generate and download a QR code as a PNG file
router.get('/download_qr', async (req, res, next) => {
    try {
        const { link } = req.query;
        // Validate the input link
        if (!link) {
            return res.status(400).json({ error: 'Link is required.' });
        }
        // Define the file path where the QR code will be saved
        const filePath = path.join(__dirname, 'qrcode.png');

        // Generate the QR code and save it as a file
        QRCode.toFile(filePath, link, { errorCorrectionLevel: 'H' }, (err) => {
            if (err) {
                return next(err);
            }
            // Set headers to prompt download
            res.setHeader('Content-Disposition', 'attachment; filename="qrcode.png"');
            res.setHeader('Content-Type', 'image/png');

            // Stream the file to the response
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);

            // Delete the file after sending it to the client
            fileStream.on('end', () => {
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        });
    } catch (error) {
        next(error);
    }
});




// // API to generate and download a QR code with a logo
// router.get('/download_qr_logo', async (req, res) => {
//     const { link, width } = req.query;
//     if (!link  || !width) {
//         return res.status(400).send('Missing required parameters');
//     }
//     try {
//       // Path to the center icon image
//       const centerImage = path.join(__dirname, 'logo.png'); 
  
//       // Generate QR code with icon
//       const qrCodeBuffer = await createQRCodeWithIcon(link, centerImage, 300, parseInt(width, 10));
  
//       // Set headers and send the image
//       res.setHeader('Content-Disposition', 'attachment; filename="qr_code_with_icon.png"');
//       res.setHeader('Content-Type', 'image/png');
//       res.send(qrCodeBuffer);
//     } catch (error) {
//       console.error('Error generating QR code:', error);
//       res.status(500).send('Error generating QR code');
//     }
//   });

// // API to generate and download a QR code with a logo
// router.get('/download_qr_logo', async (req, res) => {
//     const { link, width, directUrl } = req.query;

//     if (!link || !width || !directUrl) {
//         return res.status(400).send('Missing required parameters');
//     }

//     try {
//         // Construct the full tracking URL with the redirectUrl
//         const trackingUrl = `${link}?redirectUrl=${encodeURIComponent(directUrl)}`;

//         // Path to the center icon image
//         const centerImage = path.join(__dirname, 'logo.png');

//         // Generate QR code with icon
//         const qrCodeBuffer = await createQRCodeWithIcon(trackingUrl, centerImage, 300, parseInt(width, 10));

//         // Set headers and send the image
//         res.setHeader('Content-Disposition', 'attachment; filename="qr_code_with_icon.png"');
//         res.setHeader('Content-Type', 'image/png');
//         res.send(qrCodeBuffer);
//     } catch (error) {
//         console.error('Error generating QR code:', error);
//         res.status(500).send('Error generating QR code');
//     }
// });


// API to generate and download a QR code with a logo
router.get('/download_qr_logo', async (req, res) => {
    const { link, width } = req.query;

    if (!link || !width) {
        return res.status(400).send('Missing required parameters');
    }

    try {
        // Path to the center icon image
        const centerImage = path.join(__dirname, 'logo.png');

        // Generate QR code with icon
        const qrCodeBuffer = await createQRCodeWithIcon(link, centerImage, 300, parseInt(width, 10));

        // Set headers and send the image
        res.setHeader('Content-Disposition', 'attachment; filename="qr_code_with_icon.png"');
        res.setHeader('Content-Type', 'image/png');
        res.send(qrCodeBuffer);

    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).send('Error generating QR code');
    }
});

module.exports = router; 