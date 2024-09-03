const mongoose = require('mongoose')


const visitSchema = new mongoose.Schema({
    storeId: { type: String, required: true },
    visitCount: { type: Number, default: 0 },
    visitTimes: [{ type: Date,  default: () => {
        const now = new Date();
        now.setHours(now.getHours() + 7);
        return now;
    }, }],
    lastVisited: { type: Date,  default: () => {
        const now = new Date();
        now.setHours(now.getHours() + 7);
        return now;
    }, },
    ipAddress: {
        type:String,
    },
    userAgent: [{ type: String }],  // Changed to an array of strings
    // You can add more fields as needed, such as:
    browser: {
       type: String
    },
    os: {
        type:String
    },
    device: {
       type: String
    },
});




const visitSchemaModel = mongoose.model("visits", visitSchema);
module.exports = visitSchemaModel;