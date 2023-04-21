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
      <template  v-slot:header.action>
        <v-btn
          tile
          color="normal"
          @click="editUser('')"
        >
          <v-icon left>
            mdi-plus
          </v-icon>
          新增用户
        </v-btn>  
      </template>
      <template v-slot:item.action="{ item }">
        <v-btn
          tile
          color="success"
          @click="editUser(item)"
        >
          <v-icon left>
            mdi-pencil
          </v-icon>
          编辑用户
        </v-btn>  
      </template>
    </v-data-table>
    <div class="text-center">
        <v-dialog
        v-model="dialogUser"
        width="500"
        >
        <v-card>
            <v-card-title>
                <span class="headline">{{dialogName}}</span>
            </v-card-title>
            <v-card-text>
                <v-container>
                    <v-row>
                        <v-col cols="12" sm="6" md="12">
                            <v-text-field
                            v-model="userName"
                            label="姓名"
                            ></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="6" md="12">
                          
                          <v-select
                            v-model="userType"
                            :items="typeOptions"
                            label="所属组别"
                          ></v-select>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="6" md="12">
                          
                          <v-select
                            v-model="userStatus"
                            :items="statusOptions"
                            label="状态"
                          ></v-select>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeDialog"> 取消 </v-btn>
                <v-btn color="blue darken-1" text @click="saveUser"> 保存 </v-btn>
            </v-card-actions>
        </v-card>
        </v-dialog>
    </div>
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
            { text: '所属组别', value: 'type'},
            { text: '状态', value: 'status' },
            { text: 'Action', value: 'action'}
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
        dialogUser: false,
        dialogName: '新增用户',
        userID: 0,
        userName: '',
        userStatus: '启用',        
        userType: '基础管理一组',
        userError: '',
        statusOptions: ['启用', '禁用'],
        typeOptions: ['基础管理一组', '基础管理二组', '税收监管组'],
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
        editUser(currentUser) {
          if(currentUser == ''){
            this.dialogName = '新增用户'
            this.userName = ''
            this.userStatus = '启用'
            this.userType = '基础管理一组'
            this.userID = 0
          } else {
            this.dialogName = '编辑用户'
            this.userName = currentUser.name
            this.userStatus = currentUser.status
            this.userType = currentUser.type
            this.userID = currentUser.id
          }
          this.dialogUser = true
        },
        closeDialog () {
            this.dialogUser = false
        },
        saveUser () {
          let params = {userID: this.userID, userName: this.userName, userStatus: this.userStatus, userType: this.userType}
          let res = window.ipcRenderer.sendSync('saveUser', params)
          if(res == '成功'){
            this.closeDialog()
            this.getUsers()
          }
        }
    },
  }
</script>