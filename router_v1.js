const express = require('express');
const router = express.Router();
const requestIp = require('request-ip');
const useragent = require('useragent');
const { v4: uuidv4 } = require('uuid'); // Import the uuid package
const { format } = require('path');


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

router.get('/track/:storeId', async (req, res, next) => {
    try {
        const { storeId } = req.params;
        const ipAddress = requestIp.getClientIp(req);
        const agent = useragent.parse(req.headers['user-agent']);
        // const browser = agent.toAgent();
        // const os = agent.os.toString();
        // const device = agent.device.toString();
        const userAgent = req.headers['user-agent'];

        // Function to get the current visit time and adjust for time zone
        const visitTime = () => {
            const now = new Date();
            now.setHours(now.getHours() + 7);
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
                userAgent,
                browser,
                os,
                device,
                uniqueVisitors: [ipAddress],
            });
        } else {
            storeVisit.visitCount += 1;
            storeVisit.visitTimes.push(currentVisitTime); // Add the formatted visit time
            storeVisit.lastVisited = visitTime();
            storeVisit.ipAddress = ipAddress;
            storeVisit.userAgent = userAgent;
            // storeVisit.browser = browser;
            // storeVisit.os = os;
            // storeVisit.device = device;

            // Ensure uniqueVisitors is defined and is an array
            if (!Array.isArray(storeVisit.uniqueVisitors)) {
                storeVisit.uniqueVisitors = [];
            }

            // Check if the IP address is already in the uniqueVisitors array
            if (!storeVisit.uniqueVisitors.includes(ipAddress)) {
                storeVisit.uniqueVisitors.push(ipAddress);
            }
        }

        await storeVisit.save();
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

module.exports = router; 