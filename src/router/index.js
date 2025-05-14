import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Feed from '../views/Feed.vue'
import { getAuth } from 'firebase/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/feed',
    name: 'Feed',
    component: Feed,
    meta: { requiresAuth: true }
  },
  {
    path: '/posts/new',
    name: 'NewPost',
    component: () => import('../views/NewPost.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },

  {
    path: '/login',
    name: 'Login',
    component: () => import('../components/Auth/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../components/Auth/Register.vue')
  },

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Middleware pour vérifier l'authentification
router.beforeEach((to, from, next) => {
  const auth = getAuth()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !auth.currentUser) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
