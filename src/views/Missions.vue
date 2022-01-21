<template>
    <div>
        <v-breadcrumbs :items="bc_items" large></v-breadcrumbs>
        <v-row>
            <v-col
              class="d-flex align-bottom pt-3 pl-5 pr-5"
              cols="12"
              sm="3"
            >                    
              <v-autocomplete
                v-model="filter.excelName"
                :items="excelItems"
                :loading="excelLoading"
                :search-input.sync="excelSearch"
                hide-no-data
                hide-selected
                item-text="name"
                item-value="id"
                label="EXCEL名称"
                placeholder="搜索EXCEL"
                return-object
              ></v-autocomplete>
            </v-col>
            <v-col
              class="d-flex align-bottom pt-3"
              cols="12"
              sm="3"
            >                
              <v-text-field 
                placeholder="搜索目标" 
                v-model="itemSearch"
                >
              ></v-text-field>
            </v-col>
            <v-col
              class="d-flex align-bottom pt-3"
              cols="12"
              sm="3"
            >                
              <v-text-field 
                placeholder="搜索负责人" 
                v-model="itemSearch"
                >
              ></v-text-field>
            </v-col>
            <v-col
                class="d-flex align-bottom pt-3"
                cols="12"
                sm="3"        
            >
                <v-btn
                    class="mr-3"
                    color="secondary"
                    elevation="2"
                    large
                    @click="getMissions()"
                >搜索</v-btn>
                <v-btn
                    ml-3
                    color="warning"
                    elevation="2"
                    large
                    @click="uploadExcel()"
                >上传</v-btn>
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
    <div class="text-center">
        <v-dialog
        v-model="dialogUpload"
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
                          <v-file-input
                            v-model="uploadFile"
                            accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            label="请选择EXCEL文件(*.xlsx)"
                            show-size
                            truncate-length="20"
                          ></v-file-input>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeDialog"> 取消 </v-btn>
                <v-btn color="blue darken-1" text @click="doUpload"> 保存 </v-btn>
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
            { text: 'EXCEL名称', value:'excel'},
            { text: '社会信用代码/纳税人识别号', value: 'code' },
            { text: '名称', value: 'name' },
            { text: '负责人', value: 'assigned_to' },
        ],
        filter: {
          excelName : '',
          assigned: '',
        },
        userdata: [],
        loading: true,
        excelLoading: true,
        excelItems: [],
        excelSearch: '',
        bc_items: [
            {
                text: '主页',
                disabled: false,
                href: '/home',
            },
            {
                text: '任务列表',
                disabled: false,
                href: ''
            }
        ],
        itemSearch: '',
        dialogUpload: false,
        dialogName: '上传EXCEL',
        userID: 0,
        userName: '',
        userStatus: '启用',
        userError: '',
        statusOptions: ['启用', '禁用'],
        uploadFile: ''
    }),
    created () {
        this.getMissions()
    },
    watch: {
        itemSearch () {
            this.getMissions()
        }
    },
    methods: {
        getMissions: _.debounce(function() {
            this.loading = true
            this.errorMessages = ''
            this.userdata  = window.ipcRenderer.sendSync('getMissionsList', this.itemSearch)
            this.loading = false
        }, 500),
        uploadExcel() {
          this.dialogUpload = true
        },
        closeDialog () {
            this.dialogUpload = false
        },
        doUpload () {
          console.log(this.uploadFile)
          let params = {name: this.uploadFile.name, path: this.uploadFile.path}
          let res = window.ipcRenderer.sendSync('uploadExcel', params)
          console.log(res)
          if(res == '成功'){
            this.closeDialog() 
            this.getMissions()
          }
        }
    },
  }
</script>