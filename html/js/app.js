$(function () {
    var trendURL = '../scripts/metrics.js/json';

    // Instantiate our custom widget with standard options
    const $telemetry = $("#switch-ports").switchflows({
        portCount: 64,
        maxBps: 1, // normalized 
        maxThickness: 12
    });

    var db = {};
    var $trend = null;

    function updateData(data) {
        if (!$trend) {
            $('#title').html(data.title);
            $(document).prop('title', data.title);
            $trend = $("#traffic-trend").chart({
                type: 'topn',
                stack: true,
                includeOther: false,
                metric: 'topn',
                legendHeadings: data.keys.split(','),
                units: 'Bits per Second'}, db);
        }

        $telemetry.switchflows("update", data['switchflows']);

        if (!data
                || !data.trend
                || !data.trend.times
                || data.trend.times.length === 0)
            return;

        if (db.trend) {
            // merge in new data
            var maxPoints = db.trend.maxPoints;
            db.trend.times = db.trend.times.concat(data.trend.times);
            var remove = db.trend.times.length > maxPoints ? db.trend.times.length - maxPoints : 0;
            if (remove)
                db.trend.times = db.trend.times.slice(remove);
            for (var name in db.trend.trends) {
                db.trend.trends[name] = db.trend.trends[name].concat(data.trend.trends[name]);
                if (remove)
                    db.trend.trends[name] = db.trend.trends[name].slice(remove);
            }
        } else
            db.trend = data.trend;

        db.trend.start = new Date(db.trend.times[0]);
        db.trend.end = new Date(db.trend.times[db.trend.times.length - 1]);
        db.trend.values = data.trend.values;

        $.event.trigger({type: 'updateChart'});
    }

    (function pollTrends() {
        $.ajax({
            url: trendURL,
            dataType: 'json',
            data: db.trend && db.trend.end ? {after: db.trend.end.getTime()} : null,
            success: function (data) {
                if (data) {
                    updateData(data);
                }
            },
            complete: function (result, status, errorThrown) {
                setTimeout(pollTrends, 1000);
            },
            timeout: 60000
        });
    })();

    $(window).resize(function () {
        $.event.trigger({type: 'updateChart'});
    });
});
