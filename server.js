// 1
const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')
const knex = require ('knex')

const db = knex({
	// pg = postgres
	client: 'pg',
	connection: {
	host : 'localhost',
	user : 'postgres',
	password : 'dell',
	database : 'smartbrain'
}
})

// 2 - create app by running express()
const app = express()

app.use(bodyParser.json())
app.use(cors())

const database = {
	users: [
		{
			id: '123',
			name: 'ekong',
			email: 'ekong@gmail.com',
			password: '123',
			entries: 0,
			joined: new Date()
		},

		{
			id: '231',
			name: 'drexel',
			email: 'drexel@gmail.com',
			password: '321',
			entries: 0,
			joined: new Date()
		}
	]
}

// 4 - create a basic route at the root route
// test at postman, run GET
app.get('/', (req, res) => {
	res.send(database.users)
})

// signin
app.post('/signin', (req, res) => {
	db.select('email', 'hash').from('login')
		.where('email', '=', req.body.email)
		.then(data => {
			const isValid = bcrypt.compareSync(req.body.password, data[0].hash)
			if (isValid) {
				return db.select('*').from('users')
					.where('email', '=', req.body.email)
					.then(user => {
						res.json(user[0])
					})
					.catch(err => res.status(400).json('Unable to get user'))
			} else {
				res.status(400).json('Wrong credentials')
			}
		})
		.catch(err => res.status(400).json('Something Wong'))
})

// register
app.post('/register', (req, res) => {
	const { name, email, password } = req.body
	const hash = bcrypt.hashSync(password)

	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
				.returning('*')
				.insert({
					email: loginEmail[0],
					name: name,
					joined: new Date()
				})
				.then(user => {
					res.json(user[0])
				})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => res.status(400).json('Unable to register'))	
}) 

// profile/:userid --> :id allows any entry in the browser that can be grabbed at the req.params property
app.get('/profile/:id', (req, res) => {
	const { id } = req.params
	console.log(req.params)

	db.select('*').from('users').where({
		id: id
	})
	.then(user => {
		if (user.length) {
			res.json(user[0])
		} else {
			res.status(400).json('Not found')
		}
	})
	.catch(err => res.status(400).json('Error getting user'))
})

// update image entries
app.put('/image', (req, res) => {
	const { id } = req.body

	db('users').where('id', '=', id)
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0])
	})
	.catch(err => res.status(400).json('Unable to get entries'))
})

// 3 - listen, test at console npm start
app.listen(3001, ()=> {
	console.log('app is running at port 3001')
})

// API plan
/* ENDPOINTS

/ --> res = this is working (root route)
/signin --> POST req (user info), res (success or fail)
/register --> POST req (add data to DB), res (user object)
/profile/:userId --> GET req (get user info), res (user info)
/image --> PUT --> return user

*/