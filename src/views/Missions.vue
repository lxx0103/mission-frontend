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
                v-model="excelSelected"
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
                v-model="filter.name"
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
                v-model="filter.assigned"
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
                            truncate-length="20"
                            :loading="uploadLoading"
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
    <div class="text-center">
        <v-dialog
        v-model="errorDialog"
        width="500"
        >
        <v-card>
            <v-card-title>
                <span class="headline">发生错误</span>
            </v-card-title>
            <v-card-text>
                <v-container>
                    <v-row>
                        <v-col cols="12" sm="6" md="12">
                          <v-alert type="error">
                            {{errorMessages}}
                          </v-alert>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeErrorDialog"> 确定 </v-btn>
            </v-card-actions>
        </v-card>
        </v-dialog>
    </div>
    <div class="text-center">
        <v-dialog
        v-model="downloadDialog"
        width="500"
        >
        <v-card>
            <v-card-title>
                <span class="headline">下载分配结果</span>
            </v-card-title>
            <v-card-text>
                <v-container>
                    <v-row>                      
                      <v-alert type="success">
                        分配结果已存到excels文件夹中:
                        文件名为:{{newExcel}}
                      </v-alert>
                    </v-row>
                </v-container>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeDownloadDialog"> 确定 </v-btn>
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
            // { text: 'ID', value: 'id'},
            { text: 'EXCEL名称', value:'excel_name'},
            { text: 'EXCEL SHEET', value:'real_sheet'},
            { text: 'EXCEL行号', value:'excel_row'},
            { text: '社会信用代码/纳税人识别号', value: 'code' },
            { text: '名称', value: 'name' },
            { text: '负责人', value: 'assigned' },
        ],
        filter: {
          excel_id : 0,
          name : '',
          assigned: '',
        },
        userdata: [],
        loading: true,
        excelLoading: true,
        excelItems: [],
        excelSearch: '',
        excelSelected: 0,
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
        uploadFile: null,
        errorDialog: false,
        errorMessages:'',
        newExcel: '',
        downloadDialog: false,
        uploadLoading: false,
    }),
    created () {
        this.getMissions()
    },
    watch: {
        excelSearch () {
            this.getExcels()
        }
    },
    methods: {
        getExcels: _.debounce(function() {
            this.excelLoading = true
            this.excelItems  = window.ipcRenderer.sendSync('getExcelsList', this.excelSearch == null ? '' : this.excelSearch )
            this.excelLoading = false
        }, 500),
        getMissions: _.debounce(function() {
            this.filter.excel_id = this.excelSelected == null ? 0 : ( typeof this.excelSelected.id == 'undefined' ? 0 : this.excelSelected.id )
            this.loading = true
            this.userdata  = window.ipcRenderer.sendSync('getMissionsList', this.filter)
            this.loading = false
        }, 500),
        uploadExcel() {
          this.uploadFile = null
          this.dialogUpload = true
        },
        closeDialog () {
            this.dialogUpload = false
        },
        closeErrorDialog () {
            this.errorDialog = false
            this.closeDialog()
        },
        closeDownloadDialog () {
            this.downloadDialog = false
        },
        doUpload () {
          if (this.uploadFile == null) {
            return
          }
          this.uploadLoading = true
          let params = {name: this.uploadFile.name, path: this.uploadFile.path}
          let res = window.ipcRenderer.sendSync('uploadExcel', params)
          if(res[0] == '成功'){
            this.uploadLoading = false
            this.closeDialog() 
            this.getMissions()
            this.newExcel = res[1]
            this.downloadDialog = true
          }else{
            this.uploadLoading = false
            this.errorMessages = res
            this.errorDialog = true
          }
        }
    },
  }
</script>