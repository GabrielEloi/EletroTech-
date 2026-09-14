import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

import './assets/css/button.css'
import './assets/css/card.css'
import './assets/css/footer.css'
import './assets/css/form.css'
import './assets/css/header.css'
import './assets/css/input.css'
import './assets/css/login.css'
import './assets/css/main.css'
import './assets/css/sidebar.css'
import './assets/css/theme.css'
import './assets/css/modal-form.css'
import './assets/css/pagination.css'
import './assets/css/chatbot.css'
import './assets/css/home.css'

import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
