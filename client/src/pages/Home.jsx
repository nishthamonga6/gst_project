import React from 'react'

export default function Home({ user }) {
  return (
    <div>
      <h1>Welcome to GST MERN App</h1>
      <p>{user ? `Hello ${user.name}` : 'Please login or signup.'}</p>
    </div>
  )
}
