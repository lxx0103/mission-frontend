import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from '@/components/Layout'
import Home from '@/views/Home.vue'
import Users from '@/views/Users.vue'


Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'Layout',
        redirect: '/home',
        component: Layout,
        children: [
            {
                path: '/home',
                name: 'Home',
                component: Home,
                meta: {
                    title: 'Home'
                }
            },
            {
                path: '/users',
                name: 'Users',
                component: Users,
                meta: {
                    title: 'Users'
                }
            },
            
        ]
    }
]

const router = new VueRouter({
    mode: 'history',
    routes
})
export default router
