mui.init();

app.controller("bodyCtl", ["$scope", "DataService", "ApiService", "UtilsService", "$filter", "TapService", "AuthService", "CacheService", function ($scope, DataService, ApiService, UtilsService, $filter, TapService, AuthService, CacheService) {
    $scope.domData = {
        info: {},
        id: query("id")
    };
    $scope.curUser = CacheService.get("user");

    $scope.States = {
        1: "签到",
        2: "记录",
        3: "签退"
    };

    $scope.audio = {}; // 音频
    $scope.imageList = []; //图片
    $scope.videoList = []; //视频



    $scope.event = {
        add: function () {
            var data = $scope.domData.info[0];
            var state = $scope.domData.list.length == 0 ? 1 : 2;
            UtilsService.openWindow({
                url: "eq-log-add.html?equid=" + data.ID + "&mdcode=" + data.MDCode + "&state=" + state,
                id: "eq-log-add.html"
            })
        },
        openLogInfo: function (id) {
            UtilsService.openWindow({
                url: "eq-log-info.html?id=" + id,
                id: "eq-log-info.html"
            })
        },
        back:function(){
            mui.back();
        }
    };

    var curData = {
        info: function () {
            var url = ApiService.Api50 + "/api/v1/Equipment/GetEqLogInfo?logId=" + $scope.domData.id;
            DataService.get(url).then(function (res) {

                $scope.audio = res.ArmAttach; //音频
                $scope.imageList = res.ImgAttach; //图片
                $scope.videoList = res.VideoAttach; //视频


                $scope.domData.info = res;
                mui.hideLoading();
            }, function () {
                mui.hideLoading();
            })
        }
    };

    curData.info();
}]);

mui.showLoading("", "div");

mui.plusReady(function () {
    angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});