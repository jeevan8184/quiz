import React from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const About = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            About This App
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
            This app is built with React and demonstrates a simple layout.
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
            It uses Tailwind CSS for styling and supports dark mode.
        </p>
        <Link to="/" className="mt-4 text-blue-500 hover:underline">
            Go back to Home
        </Link>
        <Link to="/login" className="mt-4 text-blue-500 hover:underline">
            Go to Login
        </Link>
        <button
            onClick={() => toast.success('This is a toast message!')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
            make toast
        </button>
    </div>
  )
}

export default About

