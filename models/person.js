const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

const url = process.env.MONGODB_URI;

console.log('Connecting to', url);

mongoose.connect(url)
    .then(result => {
        console.log('Connected to MongoDB')
    })
    .catch((error) => {
        console.log('Error connecting to MongoDB', error.message)
    })

const personSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        required: true
    },
    number:{
        type: String,
        minLength: 8,
        validate: {
            validator: function(v) {
                return /\d{2,3}-\d{7,8}/.test(v)
            },
            message: props => `${props.value} is not a valid phone number`
        },
        required: [true, 'User phone number required']
    }
});

personSchema.set('toJSON', {
    transform: (document, returedObject) => {
        returedObject.id = returedObject._id.toString()
        delete returedObject._id
        delete returedObject.__v
    }
});

module.exports = mongoose.model('Person', personSchema);