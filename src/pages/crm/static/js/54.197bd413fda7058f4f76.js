webpackJsonp([54],{"8AQD":function(t,s,e){"use strict";Object.defineProperty(s,"__esModule",{value:!0});var a=e("Gu7T"),i=e.n(a),o=e("Dd8w"),l=e.n(o),n=e("NYxO"),r=e("YxJB"),c=e("3Lt7"),p=e("ABCa"),u=e("rHil"),h=e("pDNl"),f=e("cq2Q"),d=e("8pLc"),g=(l()({},Object(n.d)(["setIsMyClient"]),{getData:function(t,s){var e=this;this.$vux.loading.show({text:"加载中"}),this.params.page=s||this.params.page,this.getAxios("/Customer/GetCompCustomerList?isShare=1",this.params).then(function(s){e.$vux.loading.hide(),s.Data.List.length>0?(2===t?(e.clientList=[].concat(i()(e.clientList),i()(s.Data.List)),e.$refs.scroll.scroll.finishPullUp()):(e.clientList=s.Data.List,e.$refs.scroll.scroll.finishPullDown(),e.$refs.scroll.scrollTo(0,0),e.$refs.scroll.forceUpdate(!0)),e.params.page+=1,e.$refs.scroll.refresh()):1==t?(e.clientList=[],e.$refs.scroll.forceUpdate()):e.$refs.scroll.forceUpdate()}).catch(function(t){e.$vux.loading.hide(),console.log(t)})},goto:function(t,s){this.$router.push({path:t,query:{id:s}})}}),r.a,c.a,p.a,f.a,u.a,h.a,d.a,{data:function(){return{clientList:[],params:{customerName:"",beginDate:"",endDate:"",page:1,count:10},pullUp:{threshold:0,txt:{more:"加载更多",noMore:"没有更多了"}},pullDown:{threshold:50,stop:20},isSort:!1}},methods:l()({},Object(n.d)(["setIsMyClient"]),{getData:function(t,s){var e=this;this.$vux.loading.show({text:"加载中"}),this.params.page=s||this.params.page,this.getAxios("/Customer/GetCompCustomerList?isShare=1",this.params).then(function(s){e.$vux.loading.hide(),s.Data.List.length>0?(2===t?(e.clientList=[].concat(i()(e.clientList),i()(s.Data.List)),e.$refs.scroll.scroll.finishPullUp()):(e.clientList=s.Data.List,e.$refs.scroll.scroll.finishPullDown(),e.$refs.scroll.scrollTo(0,0),e.$refs.scroll.forceUpdate(!0)),e.params.page+=1,e.$refs.scroll.refresh()):1==t?(e.clientList=[],e.$refs.scroll.forceUpdate()):e.$refs.scroll.forceUpdate()}).catch(function(t){e.$vux.loading.hide(),console.log(t)})},goto:function(t,s){this.$router.push({path:t,query:{id:s}})}}),mounted:function(){var t=this;this.setIsMyClient(!1),this.getData(),this.$bus.on("init",function(){t.getData()})},beforeRouteLeave:function(t,s,e){"/"==t.path&&this.setIsMyClient(!0),e()},components:{Flexbox:r.a,FlexboxItem:c.a,XHeader:p.a,Scroll:f.a,Group:u.a,XInput:h.a,NoData:d.a}}),m={render:function(){var t=this,s=t.$createElement,e=t._self._c||s;return e("transition",{attrs:{name:"slide"}},[e("div",{staticClass:"cList"},[e("x-header",{attrs:{"left-options":{backText:""}}},[t._v("共享客户")]),t._v(" "),e("group",{staticClass:"pt48 client_query",staticStyle:{background:"#fff","padding-top":"46px"},attrs:{gutter:"0"}},[e("x-input",{attrs:{placeholder:"请输入客户名称"},on:{"on-enter":function(s){t.getData(1,1)}},model:{value:t.params.customerName,callback:function(s){t.$set(t.params,"customerName","string"==typeof s?s.trim():s)},expression:"params.customerName"}})],1),t._v(" "),e("scroll",{ref:"scroll",staticClass:"list-wrap",attrs:{pullUpLoad:t.pullUp,pullDownRefresh:t.pullDown,background:"#F0F2FF"},on:{pullingUp:function(s){t.getData(2)},pullingDown:function(s){t.getData(1,1)}}},[e("ul",t._l(t.clientList,function(s,a){return e("li",{key:a,on:{click:function(e){t.goto("/shareClient/clientDetails",s.ID)}}},[e("h3",[e("span",{staticStyle:{"max-width":"200px"}},[e("i",{staticClass:"iconfont icon-gongsi-",staticStyle:{"margin-right":"4px",color:"#1e9fff"}}),t._v("\n              "+t._s(s.CustomerName)+"\n            ")]),t._v(" "),e("span",[e("span",{staticStyle:{"vertical-align":"middle","font-size":"12px",color:"#DFB797"}},[t._v(t._s(s.CustStateName))]),t._v(" "),e("svg",{staticClass:"vux-x-icon vux-x-icon-ios-arrow-right",attrs:{type:"ios-arrow-right",size:"20",xmlns:"http://www.w3.org/2000/svg",width:"20",height:"20",viewBox:"0 0 512 512"}},[e("path",{attrs:{d:"M160 115.4L180.7 96 352 256 180.7 416 160 396.7 310.5 256z"}})])])]),t._v(" "),e("p",{staticClass:"body_p"},[t._v("所在城市 | "+t._s(s.Province+s.City+s.District))]),t._v(" "),e("p",{staticClass:"body_p"},[e("span",[t._v("联系人 | "+t._s(s.LinkName))])]),t._v(" "),e("p",{staticClass:"body_p"},[t._v("手机号 | "+t._s(s.LinkPhone))]),t._v(" "),e("p",{staticStyle:{"font-size":"12px",color:"#DADADA"}},[t._v("所有者："+t._s(s.SaleChiefName))])])})),t._v(" "),0==t.clientList.length?e("no-data"):t._e()],1),t._v(" "),e("router-view")],1)])},staticRenderFns:[]};var v=e("VU/8")(g,m,!1,function(t){e("g16Y")},"data-v-39e0e186",null);s.default=v.exports},g16Y:function(t,s){}});
//# sourceMappingURL=54.197bd413fda7058f4f76.js.map