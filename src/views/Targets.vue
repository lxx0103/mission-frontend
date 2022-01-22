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
                placeholder="搜索纳税人编号" 
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
        :items="targetdata"
        :loading="loading"
        :items-per-page="15" 
        fixed-header 
        class="elevation-1"
    >
      <template  v-slot:header.action>
        <v-btn
          tile
          color="normal"
          @click="editTarget('')"
        >
          <v-icon left>
            mdi-plus
          </v-icon>
          新增纳税人
        </v-btn>  
      </template>
      <template v-slot:item.action="{ item }">
        <v-btn
          tile
          color="success"
          @click="editTarget(item)"
        >
          <v-icon left>
            mdi-pencil
          </v-icon>
          编辑纳税人
        </v-btn>  
      </template>
    </v-data-table>
    <div class="text-center">
        <v-dialog
        v-model="dialogTarget"
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
                            v-model="code"
                            label="纳税人编号"
                            ></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="6" md="12">
                            <v-autocomplete
                                v-model="userSelected"
                                :items="userItems"
                                :loading="userLoading"
                                :search-input.sync="userSearch"
                                hide-no-data
                                hide-selected
                                item-text="name"
                                item-value="id"
                                label="管事人员"
                                placeholder="选择管事人员"
                                return-object
                            ></v-autocomplete>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeDialog"> 取消 </v-btn>
                <v-btn color="blue darken-1" text @click="saveTarget"> 保存 </v-btn>
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
            { text: '纳税人编号', value: 'code' },
            { text: '管事人员', value: 'to'},
            { text: 'Action', value: 'action'}
        ],
        targetdata: [],
        loading: true,
        bc_items: [
            {
                text: '主页',
                disabled: false,
                href: '/home',
            },
            {
                text: '特殊纳税人管理',
                disabled: false,
                href: ''
            }
        ],
        itemSearch: '',
        dialogTarget: false,
        dialogName: '新增纳税人',
        targetID: 0,
        code: '',
        to: '',
        userSelected: 0,
        userItems: [],
        userLoading: false,
        userSearch: '',
        errorMessages:'',
        errorDialog: false,
    }),
    created () {
        this.getTargets()
    },
    watch: {
        itemSearch () {
            this.getTargets()
        },
        userSearch () {
            this.getUsers()
        }
    },
    methods: {
        getUsers: _.debounce(function() {
            this.userLoading = true
            this.userItems  = window.ipcRenderer.sendSync('getSPUsers', this.userSearch == null ? '' : this.userSearch )
            this.userLoading = false
        }, 500),
        getTargets: _.debounce(function() {
            this.loading = true
            this.targetdata  = window.ipcRenderer.sendSync('getTargetList', this.itemSearch)
            this.loading = false
        }, 500),
        editTarget(currentTarget) {
            console.log(currentTarget)
          if(currentTarget == ''){
            this.dialogName = '新增纳税人'
            this.code = ''
            this.userSelected = 0
            this.targetID = 0
          } else {
            this.dialogName = '编辑纳税人'
            this.code = currentTarget.code
            this.targetID = currentTarget.id
          }
          this.dialogTarget = true
        },
        closeDialog () {
            this.dialogTarget = false
        },
        closeErrorDialog () {
            this.errorDialog = false
        },
        saveTarget () {
          let params = {targetID: this.targetID, code: this.code, to: this.userSelected.name}
          let res = window.ipcRenderer.sendSync('saveTarget', params)
          if(res == '成功'){
            this.closeDialog()
            this.getTargets()
          }else{
            this.errorMessages = res
            this.errorDialog = true
          }
        }
    },
  }
</script>