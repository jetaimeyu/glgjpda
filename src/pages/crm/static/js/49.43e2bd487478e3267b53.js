webpackJsonp([49],{AkY7:function(t,e,a){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var s=a("Gu7T"),i=a.n(s),o=a("oqQY"),r=a.n(o),l=a("YxJB"),n=a("3Lt7"),c=a("ABCa"),u=a("rHil"),p=a("UNGY"),f=a("2sLL"),h=a("cq2Q"),d=a("8pLc"),g=a("rUbY"),m=(l.a,n.a,c.a,h.a,d.a,u.a,f.a,p.a,g.a,{data:function(){return{clientList:[],params:{beginFollowupDate:"",endFollowupDate:"",page:1,count:10,follState:0,custState:0,createUserId:this.$store.state.CurrentUserID},pullUp:{threshold:0,txt:{more:"加载更多",noMore:"没有更多了"}},pullDown:{threshold:50,stop:20},isSort:!1}},mounted:function(){var t=this;this.getData(),this.$bus.once("refrech",function(){t.getData(1,1)});var e=this.$route.query;this.params.beginFollowupDate=e.beginDate||"",this.params.endFollowupDate=e.endDate||""},beforeDestroy:function(){this.$bus.off("refrech")},methods:{selectedUser:function(t){this.params.createUserId=t,this.getData(1,1)},dateQuery:function(t){this.params.beginFollowupDate=t.beginDate,this.params.endFollowupDate=t.endDate,this.getData(1,1)},clearType:function(){this.params.follState=0,this.params.custState=0,this.getData(1,1)},selectedParams:function(t){switch(t.DictType){case 4:this.params.follState=t.ID;break;case 5:this.params.custState=t.ID}this.getData(1,1)},query:function(t){1==this.leftType?this.params.follState=t.ID:this.params.custState=t.ID,this.queryType=0,this.getData(1,1)},getData:function(t,e){var a=this;this.$vux.loading.show({text:"加载中"}),this.params.page=e||this.params.page,this.getAxios("/Customer/GetMyCustomerFollowup",this.params).then(function(e){a.$vux.loading.hide(),e.Data.List.length>0?(2===t?(a.clientList=[].concat(i()(a.clientList),i()(e.Data.List)),a.$refs.scroll.scroll.finishPullUp()):(a.clientList=e.Data.List,a.$refs.scroll.scrollTo(0,0),a.$refs.scroll.scroll.finishPullDown()),a.params.page+=1,a.$refs.scroll.refresh()):1==a.params.page?(a.clientList=[],a.$refs.scroll.forceUpdate()):a.$refs.scroll.forceUpdate()}).catch(function(t){a.$vux.loading.hide()})},goto:function(t,e){this.$router.push({path:t,query:{id:e}})}},filters:{getPicSrc:function(t){return apiPic+"/dXNlci9sb2dv_"+t+"_35x35.png"},dateFormat:function(t){return t?r()(t).format("YYYY-MM-DD HH:mm"):""}},watch:{clientList:function(){var t=this;setTimeout(function(){t.$refs.scroll.forceUpdate(!0)},500)}},components:{Flexbox:l.a,FlexboxItem:n.a,XHeader:c.a,Scroll:h.a,NoData:d.a,Group:u.a,XButton:f.a,Datetime:p.a,Query:g.a}}),D={render:function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("transition",{attrs:{name:"slide"}},[a("div",{staticClass:"fList"},[a("x-header",{attrs:{"left-options":{backText:""}}},[t._v("跟进记录\n      "),a("svg",{staticClass:"vux-x-icon vux-x-icon-ios-plus-empty icon",attrs:{slot:"right",type:"ios-plus-empty",size:"30",xmlns:"http://www.w3.org/2000/svg",width:"30",height:"30",viewBox:"0 0 512 512"},on:{click:function(e){t.goto("/addFollow")}},slot:"right"},[a("path",{attrs:{d:"M384 265H264v119h-17V265H128v-17h119V128h17v120h120v17z"}})])]),t._v(" "),a("query",{attrs:{dateTitle:"跟进时间",types:[{type:4,name:"跟进状态"},{type:5,name:"客户状态"}]},on:{dateQuery:t.dateQuery,selectedParams:t.selectedParams,clearType:t.clearType,selectedUser:t.selectedUser}}),t._v(" "),a("scroll",{ref:"scroll",attrs:{background:"#F0F2FF",pullUpLoad:t.pullUp,pullDownRefresh:t.pullDown},on:{pullingUp:function(e){t.getData(2)},pullingDown:function(e){t.getData(1,1)}}},[a("ul",{staticClass:"fListWrap"},t._l(t.clientList,function(e,s){return a("li",{key:s,on:{click:function(a){t.goto("/followup/followDetails/"+e.ID)}}},[a("div",{staticClass:"flex follow_title"},[a("img",{attrs:{src:t._f("getPicSrc")(e.CreateUserID),alt:""}}),t._v(" "),a("div",[a("h3",[a("span",[t._v(t._s(e.CreateUserName))])]),t._v(" "),a("p",{staticStyle:{"font-size":"12px"}},[a("i",{staticClass:"iconfont icon-date",staticStyle:{"margin-right":"4px",color:"#1e9fff"}}),t._v("\n                "+t._s(t._f("dateFormat")(e.FollowupDate))+"\n              ")]),t._v(" "),a("p",{staticStyle:{"font-size":"12px","line-height":"20px"}},[a("i",{staticClass:"iconfont icon-gongsi-",staticStyle:{"margin-right":"4px",color:"#1e9fff"}}),t._v("\n                "+t._s(e.CustomerName)+"\n              ")])])]),t._v(" "),a("p",{staticClass:"body_p"},[a("span",{staticStyle:{color:"#333"}},[t._v(t._s(e.ResultContent))])])])})),t._v(" "),0==t.clientList.length?a("no-data"):t._e()],1),t._v(" "),a("router-view",{staticStyle:{position:"fixed",top:"0",bottom:"0","z-index":"502",left:"0",right:"0",background:"#fff"}})],1)])},staticRenderFns:[]};var v=a("VU/8")(m,D,!1,function(t){a("q0yT")},"data-v-73bbbeac",null);e.default=v.exports},q0yT:function(t,e){}});
//# sourceMappingURL=49.43e2bd487478e3267b53.js.map