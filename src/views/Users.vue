<template>
    <div>
        <v-breadcrumbs :items="bc_items" large></v-breadcrumbs>
        <v-row>
            <v-col
                class="d-flex align-bottom pt-3 pl-5 pr-5"
                cols="12"
                sm="12"
            >                
              <v-text-field 
                placeholder="搜索用户姓名" 
                v-model="itemSearch"
                prepend-inner-icon="mdi-magnify"
                append-icon="mdi-close"
                @click:append="itemSearch = ''"
                >
              ></v-text-field>
            </v-col>
        </v-row>
    <v-data-table
        :headers="headers"
        :items="userdata"
        :loading="loading"
        :items-per-page="15" 
        fixed-header 
        class="elevation-1"
    >      
    </v-data-table>
    </div>
</template>
<style lang="scss">
    td {
        border-left: 1px solid #eee;
    }
</style>
<script>
import _ from 'lodash';
  export default {
    data: () => ({
        headers: [
            { text: 'ID', value: 'id'},
            { text: '姓名', value: 'name' },
            { text: '状态', value: 'status' },
        ],
        userdata: [],
        loading: true,
        bc_items: [
            {
                text: '主页',
                disabled: false,
                href: '/home',
            },
            {
                text: '用户列表',
                disabled: false,
                href: ''
            }
        ],
        itemSearch: '',
    }),
    created () {
        this.getUsers()
    },
    watch: {
        itemSearch () {
            this.getUsers()
        }
    },
    methods: {
        getUsers: _.debounce(function() {
            this.loading = true
            this.errorMessages = ''
            this.userdata  = window.ipcRenderer.sendSync('getUserList', this.itemSearch)
            this.loading = false
        }, 500),
    },
  }
</script>