<template>
  <v-app>
    <v-app-bar app dark clipped-left>
        <v-toolbar-title>“随机配”小程序</v-toolbar-title> <v-spacer></v-spacer>
    </v-app-bar>
    <v-navigation-drawer  v-model="drawer"  clipped app style="text-align: left;">
        <v-list>
            <div
                v-for="item in items"
                :key="item.title"
            >
                <v-list-item
                    v-if="item.to"
                    router :to=item.to
                >
                    <v-list-item-icon>
                        <v-icon>{{item.icon}}</v-icon>
                    </v-list-item-icon>
                    <v-list-item-title v-text="item.title">Home</v-list-item-title>
                </v-list-item>
            </div>
        </v-list>
    </v-navigation-drawer>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
<script>
export default {
    data() {
        return {
            drawer: true,
            mini: false,
            items: [
                {
                    icon: 'mdi-home',
                    title: '主页',
                    to: '/home'
                },
                {
                    icon: 'mdi-account',
                    title: '用户列表',
                    to: '/users'
                },
                {
                    icon: 'mdi-format-list-bulleted',
                    title: '任务列表',
                    to: '/missions'
                },
                // {
                //     icon: 'mdi-flag-variant-outline',
                //     title: '重点税源、特殊税源管理',
                //     to: '/targets'
                // },
            ],
        };
    },
    created () {
    },
    methods: {
    }
};
</script>