const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const Person = require('./models/person')

const app = express();

app.use(cors())
app.use(express.json())
app.use(express.static('build'))

app.use((request, response, next) => {
    morgan.token('body', (request) => JSON.stringify(request.body));

    if (request.method === 'POST') {
        morgan(':method :url :status :res[content-length] - :response-time ms :body')(request, response, next);
    } else {
        morgan(':method :url :status :res[content-length] - :response-time ms')(request, response, next);
    }
});

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'Malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }
    next(error)
}

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
});

app.get('/info', async (request, response) => {
    try {
        const personCount = await Person.collection.countDocuments();

        response.send(`
    <div>
        <p>Phonebook has info for ${personCount} people</p>
        <p>${Date()}</p>
    </div>
    `)
    } catch (error) {
        response.status(500).send("Internal Server Error");
    }
});

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
});

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
});

app.post('/api/persons', (request, response, next) => {
    const body = request.body

    if (!body.name) {
        return response.status(400).json({ error: 'Name missing' })
    }

    const person = new Person({
        name: body.name,
        number: body.number
    })

    person.save()
        .then(savedPerson => {
            response.json(savedPerson)
        })
        .catch(error => next(error))
});

app.put('/api/persons/:id', (request, response, next) => {
    const { name, number } = request.body

    /*
    const person = {
        name: body.name,
        number: body.number
    }
    */

    Person.findByIdAndUpdate(
        request.params.id,
        { name, number },
        { new: true, runValidators: true, context: 'query' }
    )
        .then(updatePerson => {
            response.json(updatePerson)
        })
        .catch(error => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})