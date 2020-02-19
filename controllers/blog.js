const blogRouter= require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')


blogRouter.get('/', async (request, response) => {
	try{
		const blogs = await Blog.find({}).populate('user', {username: 1, name: 1})
		response.json(blogs.map(blog=>
			blog.toJSON()))
	}catch(exception){
		console.log(exception)
	}
})

blogRouter.get('/:id', async (request, response)=>{
	try{
		const blog = await Blog.findById(request.params.id)
		if (blog){
			response.json(blog.toJSON())
		}else{
			response.status(404).end()
		}
	}catch(exception){
		console.log(exception)
	}
})

blogRouter.delete('/:id', async(request, response)=>{
	try{
		await Blog.findByIdAndRemove(request.params.id)
		response.status(204).end()
	}catch(exception){
		console.log(exception)
	}

})

blogRouter.put('/:id', async(request, response)=>{
	const body = request.body
	const blog ={
		'title': body.title,
		'author': body.author,
		'url': body.url,
		'likes': body.likes
	}
	try{
		const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
		response.json(updatedBlog.toJSON())
	}catch(exception){
		console.log(exception)
	}
})

const getTokenFrom = request => {
	const authorization = request.get('authorization')
	if (authorization && authorization.toLowerCase().startsWith('bearer ')){
		return authorization.substring(7)
	}
	return null
}
// the function getTokenFrom isolate the token from the authorization header.

blogRouter.post('/', async (request, response) => {
	const token = getTokenFrom(request)

	try{
		const decodedToken = jwt.verify(token, process.env.SECRET)
		// The object decoded from the token contains the username and id fields, which tells the server who made the request.
		if (!token || !decodedToken.id){
			return response.status(401).json({ error: 'token missing or invalid !'})
		}
		if (!request.body.likes){
			request.body.likes = 0
		}
		if ((!request.body.title) && (!request.body.url)){
			response.status(400).json({error: 
				'title and url can not be missing!'})
		}else{
			const body = request.body
			const user = await User.findById(decodedToken.id)
			// it is important to change the findById(body.user) to decodedToken.id, since this id is the id for user.
			// so the userId is not needed when posting a new post!!!!
			const newBlog = new Blog(body)
			newBlog.user = user.id
			const savedBlog = await newBlog.save()
			user.blogs = user.blogs.concat(savedBlog)
			await user.save()
			response.json(savedBlog.toJSON())}
	}catch(exception){
		console.log(exception)
	}
})

module.exports = blogRouter