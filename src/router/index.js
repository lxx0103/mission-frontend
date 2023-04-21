import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from '@/components/Layout'
import Home from '@/views/Home.vue'
import Users from '@/views/Users.vue'
import Missions from '@/views/Missions.vue'
// import Targets from '@/views/Targets.vue'


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
            {
                path: '/missions',
                name: 'Missions',
                component: Missions,
                meta: {
                    title: 'Missions'
                }
            },        
            // {
            //     path: '/targets',
            //     name: 'Targets',
            //     component: Targets,
            //     meta: {
            //         title: 'Targets'
            //     }
            // },      
        ]
    }
]

const router = new VueRouter({
    mode: process.env.IS_ELECTRON ? 'hash' : 'history',
    routes
})
export default router
