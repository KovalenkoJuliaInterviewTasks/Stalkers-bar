const mongoose = require('mongoose');
require('dotenv').config();

const MenuSection = require('./models/MenuSection');

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const sections = await MenuSection.find({});
    let updatedSections = 0;
    let updatedItems = 0;

    for (const section of sections) {
        let changed = false;
        for (const item of section.items) {
            if (!item._id) {
                item._id = new mongoose.Types.ObjectId();
                changed = true;
                updatedItems++;
            }
        }
        if (changed) {
            await section.save();
            updatedSections++;
        }
    }

    console.log(`Done: updated ${updatedItems} items in ${updatedSections} sections`);
    await mongoose.disconnect();
}

migrate().catch(err => { console.error(err); process.exit(1); });
