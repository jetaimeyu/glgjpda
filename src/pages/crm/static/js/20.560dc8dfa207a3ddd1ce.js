webpackJsonp([20],{Gpgj:function(t,a){},YfaA:function(t,a){t.exports="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACJ0lEQVRYR+2Wz4uOURTHP18/J9lQmhpmZa2UBVETM1NqLCjMlJKdUhSSpX+Aomg2NqIUMwsWFBmkZsZGyt4KsyBsNKHh6NR99c47z32e+9z3nWYzZ/ncc873c+89zzlXLLFpifVZBoiegJltAC4Ce4DtwAfgDXBL0vOiqzOzAeAEsAPoBd4CU8BlSd+KYgoBzGwfcA/YFKmRUeC8pF++bmZrgavAqYj/F2BE0ovW9QUAZuY7fgWsqChQP4UDwecR0F/h/xfokzTZ7DcPwMy6gPdAT+Lf8RRYlSDeSDcDbJX0s/GhFeBsOMpE/Sy3c5KuxQAmauwmSx2YkDQYA/gKbMzNnBj3WVJ3DMALZbGb05yk1TGAj8DmxJ3kus1I+q/RWoTjwOHczIlx45KOxk7AF+4nJsp1G5Y0VggQutprYGdu9oq4aUm7o40oAGwB3gE+Czpp34Ftkj6VAgQIHyYvgfUdIvgB7JXkw2yelU3DXd40gHVtQswCA5L8ahdY6T9vZn3AE8BnRI55z98vyYdboVU2HTPztunTbk1Ngt8+LSU9K4urBAg1MQQ8DJMvhWMOOCjpcZVzEkCAOAR4o1pZkfQPcETSgypxX08GCBAjwN2Sx4rPkmOS/DWVZLUAAsRx4HZBdvP3oKQ7ScrBqTZAgDgNXG8ROinpZh3x2lfQnNzMLvhrN3w7I+lGXfG2AMJJXAJmJV3JEW8bIFe0OS6rBjoh3MixDPAP7g+WIbIlzbUAAAAASUVORK5CYII="},iFsD:function(t,a,e){"use strict";Object.defineProperty(a,"__esModule",{value:!0});var i=e("ABCa"),s=e("2sLL"),n=e("oqQY"),o=e.n(n),c=(i.a,s.a,{data:function(){return{dataObj:{},ID:0,isShow:!1}},mounted:function(){var t=this;this.ID=this.$route.params.id,this.getData(),this.$bus.on("refrech",function(){t.getData()})},beforeDestroy:function(){this.$bus.off("refrech")},methods:{getData:function(){var t=this;this.getAxios("/Customer/GetCustomerLinkManByID/"+this.ID).then(function(a){t.dataObj=a.Data,t.dataObj.LinkManAttach=a.Data.ReceiverPhoto?[a.Data.ReceiverPhoto]:[]})},delData:function(){var t=this;this.$vux.confirm.show({content:"确定删除该条数据？",onConfirm:function(){t.postAxios("/Customer/DeleteCustomerLinkMan",[t.ID]).then(function(a){t.$vux.toast.show({type:"success",text:"删除成功"}),t.$bus.emit("init"),t.$router.back()}).catch(function(a){a.ErrorMessage?t.$vux.toast.show({type:"cancel",text:a.ErrorMessage}):t.$vux.toast.show({type:"cancel",text:"删除失败"})})}})},goTo:function(){this.$router.push({path:"/client/clientDetails/addCustUser",query:{id:this.ID}})},goMdtPage:function(){plus.webview.open("http://www.giftmall.top/Mobile/LoginApi/login?oauth=maidiyun&maidiyunToken="+this.$store.state.token+"&linkID=["+this.dataObj.ID+"]&from=crm")},getPic:function(t){return api50+"/api/v1/File/DownLoadPic?filePath="+t}},filters:{dateFormat:function(t){return t?o()(t).format("YYYY-MM-DD"):""},sexFormat:function(t){return 1==t?"男":2==t?"女":""}},components:{XHeader:i.a,XButton:s.a}}),r={render:function(){var t=this,a=t.$createElement,i=t._self._c||a;return i("transition",{attrs:{name:"slide"}},[i("div",{staticStyle:{"overflow-y":"scroll"}},[i("x-header",[t._v("\n      "+t._s(t.dataObj.LinkName)+"\n      "),i("span",{staticStyle:{color:"#999","font-size":"13px","line-height":"21px"}},[t._v(t._s(0==t.dataObj.IsChief?"":"(主联系人)"))]),t._v(" "),t.$store.state.isMyClient?i("div",{staticClass:"topHeard",attrs:{slot:"right"},slot:"right"},[i("i",{staticClass:"iconfont icon-gengduo",staticStyle:{"font-size":"20px"},on:{click:function(a){t.isShow=!0}}}),t._v(" "),i("div",{directives:[{name:"show",rawName:"v-show",value:t.isShow,expression:"isShow"}],staticClass:"topList"},[i("p",{on:{click:function(a){t.goTo(),t.isShow=!1}}},[t._v("修改")]),t._v(" "),i("p",{on:{click:function(a){t.delData(),t.isShow=!1}}},[t._v("删除")])]),t._v(" "),i("div",{directives:[{name:"show",rawName:"v-show",value:t.isShow,expression:"isShow"}],staticClass:"topModal",on:{click:function(a){t.isShow=!1}}})]):t._e()]),t._v(" "),i("div",{staticClass:"client_info pt48"},[i("ul",[i("li",[i("label",[t._v("姓名：")]),t._v(" "),i("p",[t._v(t._s(t.dataObj.LinkName))])]),t._v(" "),i("li",[i("label",[t._v("性别：")]),t._v(" "),i("p",[t._v(t._s(t._f("sexFormat")(t.dataObj.LinkSex)))])]),t._v(" "),i("li",[i("label",[t._v("生日：")]),t._v(" "),i("p",[t._v(t._s(t._f("dateFormat")(t.dataObj.Birthday)))])]),t._v(" "),i("li",[i("label",[t._v("手机号：")]),t._v(" "),i("p",[t._v(t._s(t.dataObj.LinkPhone))])]),t._v(" "),i("li",[i("label",[t._v("座机：")]),t._v(" "),i("p",[t._v(t._s(t.dataObj.LinkTel))])]),t._v(" "),i("li",[i("label",[t._v("邮箱：")]),t._v(" "),i("p",[t._v(t._s(t.dataObj.LinkEmail))])]),t._v(" "),i("li",[i("label",[t._v("职务：")]),t._v(" "),i("p",[t._v(t._s(t.dataObj.LinkPost))])]),t._v(" "),i("li",[i("label",[t._v("收货人地址：")]),t._v(" "),i("p",[t._v(t._s(t.dataObj.ReceiverProvince+t.dataObj.ReceiverCity+t.dataObj.ReceiverDistrict+t.dataObj.ReceiverAddress))])]),t._v(" "),i("li",[i("label",[t._v("收货人姓名：")]),t._v(" "),i("p",[t._v(t._s(t.dataObj.ReceiverName))])]),t._v(" "),i("li",[i("label",[t._v("收货人电话：")]),t._v(" "),i("p",[t._v(t._s(t.dataObj.ReceiverPhone))])]),t._v(" "),i("li",{directives:[{name:"show",rawName:"v-show",value:t.dataObj.LinkManAttach&&t.dataObj.LinkManAttach.length>0,expression:"dataObj.LinkManAttach && dataObj.LinkManAttach.length > 0"}]},[i("div",{staticClass:"updatePic flex"},t._l(t.dataObj.LinkManAttach,function(a,e){return i("div",{key:e,staticClass:"picBoxWrap"},[i("div",{staticClass:"picBox"},[i("img",{attrs:{src:t.getPic(a.FilePath)}})])])}))])]),t._v(" "),i("div",{staticStyle:{padding:"20px 30px"}},[i("x-button",{attrs:{type:"warn"},nativeOn:{click:function(a){return t.goMdtPage(a)}}},[t._v("\n          关怀TA一下\n          "),i("img",{staticStyle:{"vertical-align":"middle",width:"18px",height:"18px"},attrs:{src:e("YfaA")}})])],1)])],1)])},staticRenderFns:[]};var l=e("VU/8")(c,r,!1,function(t){e("Gpgj")},"data-v-49eaa3a6",null);a.default=l.exports}});
//# sourceMappingURL=20.560dc8dfa207a3ddd1ce.js.map