webpackJsonp([40],{Pzg6:function(t,e){},U1UT:function(t,e,i){"use strict";(function(t,e){var s=i("Gu7T"),r=(i.n(s),i("woOf")),l=(i.n(r),i("5dBV")),a=(i.n(l),i("ABCa")),n=i("/W8D"),o=i("cq2Q");a.a,n.a,o.a}).call(e,i("oqQY"),i("mtWM"))},clZh:function(t,e,i){"use strict";Object.defineProperty(e,"__esModule",{value:!0});i("U1UT");var s=i("gccJ"),r={render:function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("div",{staticClass:"order-detl"},[i("div",{staticClass:"header"},[i("x-header",{attrs:{"left-options":{backText:""}}},[t._v(t._s(t.queryName?"成交总额":"回款总额")+"("+t._s(t.$route.query.size)+"元)("+t._s(t.Total)+"条)")])],1),t._v(" "),i("div",{ref:"clientList"},[i("scroll",{ref:"scroll",staticStyle:{height:"100%"},attrs:{pullUpLoad:t.pullUp,pullDownRefresh:t.pullDown},on:{pullingUp:t.listPullup,pullingDown:t.listPulldown}},t._l(t.List,function(e){return i("div",{key:e.ID,staticClass:"order-list"},[i("div",{staticClass:"list-header"},[i("div",{staticClass:"header-time"},[t._v(t._s(t._f("time")(e.DealDate||t.ReturnDate)))]),t._v(" "),i("div",{staticClass:"header-mon"},[t._v("¥ "+t._s(e.TotalPrice))])]),t._v(" "),i("div",{staticClass:"item-peo"},[t._v("成交客户: "+t._s(e.CustomerName))]),t._v(" "),i("div",{staticClass:"item-num"},[i("div",{staticClass:"item-peo"},[t._v("订单编号: "+t._s(e.OrderNumber))]),t._v(" "),t.queryName?i("div",{staticClass:"item-peo",staticStyle:{"word-wrap":"break-word"}},[t._v("说明: "+t._s(e.Remark))]):t._e()]),t._v(" "),i("div",{staticClass:"item-footer"},[i("div",{staticStyle:{flex:"1","padding-left":"10px"}},[i("div",{staticClass:"dis-inline im-icon",staticStyle:{background:"#44b1ff"}},[t._v("回")]),t._v(" "),i("div",{staticClass:"dis-inline le-sp-1"},[t._v(t._s(t.queryName?e.TotalReturnMeony:e.ReturnPrice))])]),t._v(" "),i("div",{staticStyle:{flex:"1"}},[i("div",{staticClass:"dis-inline im-icon",staticStyle:{background:"#ffa41d"}},[t._v("欠")]),t._v(" "),i("div",{staticClass:"dis-inline le-sp-1"},[t._v(t._s((e.TotalPrice-(t.queryName?e.TotalReturnMeony:e.ReturnPrice)).toFixed(2)))])])]),t._v(" "),i("div",{staticClass:"item-pro"},[i("div",{staticStyle:{color:"#999","padding-right":"12px"}},[t._v("回款比例:")]),t._v(" "),i("Progress",{staticStyle:{flex:"1"},attrs:{height:"20px",percentage:t._f("schedule")(t.queryName?e.TotalReturnMeony:e.ReturnPrice,e.TotalPrice)}})],1)])}))],1)])},staticRenderFns:[]};var l=function(t){i("Pzg6")},a=i("VU/8")(s.a,r,!1,l,"data-v-278b1c12",null);e.default=a.exports},gccJ:function(t,e,i){"use strict";(function(t,s){var r=i("Gu7T"),l=i.n(r),a=i("woOf"),n=i.n(a),o=i("5dBV"),c=i.n(o),u=i("ABCa"),d=i("/W8D"),v=i("cq2Q");e.a={data:function(){return{List:[],pageIndex:1,pullUp:{threshold:0,txt:{more:"加载更多",noMore:"没有更多了"}},pullDown:{threshold:50,stop:20},Total:0}},components:{XHeader:u.a,Progress:d.a,scroll:v.a},filters:{time:function(e){return t(e).format("YYYY-MM-DD")},schedule:function(t,e){return t?c()((t/e*100).toFixed(2)):0}},computed:{queryName:function(){return"订单"===this.$route.query.name}},methods:{getOrder:function(t){var e=this;this.$vux.loading.show({text:"加载中"});var i=n()({},this.$route.query,{page:this.pageIndex});i.size=null,i.name=null,s.get(["/Order/GetMyOrderList","/Cost/GetMyReturnedMoney"][this.queryName?0:1],{params:i}).then(function(i){var s=i.data.Data;e.List=t?[].concat(l()(e.List),l()(s.List)):s.List,e.Total=s.TotalCount,e.$refs.scroll.forceUpdate(),setTimeout(function(){e.$vux.loading.hide()},500)})},listPullup:function(){this.pageIndex++,this.getOrder(2),this.$refs.scroll.scroll.finishPullUp(),this.$refs.scroll.refresh()},listPulldown:function(){this.pageIndex=1,this.getOrder(),this.$refs.scroll.scroll.finishPullDown(),this.$refs.scroll.refresh()},init:function(){var t=document.body.clientHeight;this.$refs.clientList.style.height=t-5+"px"}},mounted:function(){this.init(),this.getOrder()}}}).call(e,i("oqQY"),i("mtWM"))}});
//# sourceMappingURL=40.57795d0ce7fe053740c5.js.map