webpackJsonp([3],{bibK:function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var s=a("Gu7T"),i=a.n(s),l=a("YxJB"),n=a("3Lt7"),r=a("ABCa"),c=a("HqzV"),o=a("EmH9"),u=a("cq2Q"),d=a("8pLc"),h=(l.a,n.a,r.a,u.a,c.a,o.a,d.a,{components:{Flexbox:l.a,FlexboxItem:n.a,XHeader:r.a,Scroll:u.a,Search:c.a,CheckIcon:o.a,NoData:d.a},data:function(){return{selectId:0,clientList:[],pageParams:{customerId:0,orderState:4386,beginDealDate:"",endDealDate:"",page:1,count:10,total:10},pullUp:{threshold:0,txt:{more:"加载更多",noMore:"没有更多了"}},pullDown:{threshold:50,stop:20},isSort:!1}},methods:{onChecked:function(e){this.$bus.emit("orderSelected",e),this.$router.back()},getData:function(e){var t=this;1==e&&(this.pageParams.page=1),this.Axios.get("/Order/GetPagedOrderList",{params:this.pageParams}).then(function(a){var s=a.data.Data.List;s.map(function(e){e.ID==t.selectId?e.checked=!0:e.checked=!1}),s.length>0?(2===e?(t.clientList=[].concat(i()(t.clientList),i()(s)),t.$refs.scroll.scroll.finishPullUp()):(t.clientList=s,t.$refs.scroll.scroll.finishPullDown(),t.$refs.scroll.forceUpdate(!0)),t.pageParams.page+=1,t.$refs.scroll.refresh()):t.$refs.scroll.forceUpdate()})}},mounted:function(){this.pageParams.customerId=this.$route.query.cid,this.selectId=this.$route.query.oid,this.getData()},watch:{clientList:function(){var e=this;setTimeout(function(){e.$refs.scroll.forceUpdate(!0)},500)}}}),p={render:function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("transition",{attrs:{name:"slide"}},[a("div",{staticClass:"list"},[a("x-header",[e._v("选择订单")]),e._v(" "),a("scroll",{ref:"scroll",staticStyle:{height:"100%","margin-top":"48px"},attrs:{pullUpLoad:e.pullUp,pullDownRefresh:e.pullDown},on:{pullingUp:function(t){e.getData(2)},pullingDown:function(t){e.getData(1)}}},[a("ul",{directives:[{name:"show",rawName:"v-show",value:0!=e.clientList.length,expression:"clientList.length != 0"}],staticClass:"list-wrap"},e._l(e.clientList,function(t,s){return a("li",{key:s,staticClass:"list-item"},[a("div",[a("div",[a("check-icon",{attrs:{value:t.checked},on:{"update:value":function(a){e.$set(t,"checked",a)}},nativeOn:{click:function(a){e.onChecked(t)}}})],1),e._v(" "),a("div",[e._v(e._s(t.BeginDate.replace("00:00:00","")))])]),e._v(" "),a("div",[e._v("成交客户："+e._s(t.CustomerName))]),e._v(" "),a("ul",[a("li",[e._v("订单编号："+e._s(t.OrderNumber))]),e._v(" "),a("li",[e._v("说明："+e._s(t.Remark))])])])})),e._v(" "),a("no-data",{directives:[{name:"show",rawName:"v-show",value:0==e.clientList.length,expression:"clientList.length == 0"}]})],1)],1)])},staticRenderFns:[]};var f=a("VU/8")(h,p,!1,function(e){a("l+Xo")},null,null);t.default=f.exports},"l+Xo":function(e,t){}});
//# sourceMappingURL=3.43548e377e61e99432d8.js.map