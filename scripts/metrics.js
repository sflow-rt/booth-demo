// author: InMon Corp.
// version: 0.2
// date: 10/27/2026
// description: Switch Dashboard
// copyright: Copyright (c) 2026 InMon Corp. ALL RIGHTS RESERVED

include(scriptdir() + '/inc/trend.js');

var AGENT = getSystemProperty('booth.agent') || 'ALL';
var KEYS = getSystemProperty('booth.keys') || 'ipsource,ipdestination';
var UTILIZATION = parseFloat(getSystemProperty('booth.utilization.min') || '1') * 0.00125;
var TITLE = getSystemProperty('booth.title') || 'Live Switch Dashboard';

var trend = new Trend(300, 1);
var points = {};

setFlow('booth-demo-switchports', {
    keys: 'inputifindex,outputifindex',
    value: 'bytes',
    filter: 'direction=ingress',
    aggMode: 'AGENT',
    t: 2
});

setFlow('booth-demo-flow', {
    keys: KEYS,
    value: 'bytes',
    filter: 'direction=ingress',
    aggMode: 'AGENT',
    t: 2
});

var other = '-other-';
function calculateTopN(agents, metric, n, minVal, total, scale) {
    var top = activeFlows(agents, metric, n, minVal);
    var topN = {};
    if (top) {
        var sum = 0;
        top.forEach(function (entry) {
            var val = entry.value * (scale || 1);
            topN[entry.key] = val;
            sum += val;
        });
        if (total > sum)
            topN[other] = total - sum;
    }
    return topN;
}

var switchFlows = {flows: [], nports: 0};

setIntervalHandler((now) => {
    var ifspeed = metric(AGENT, "ifspeed")[0].metricValue || 10000000000;
    points['topn'] = calculateTopN(AGENT, 'booth-demo-flow', 5, 0, 0, 8);
    trend.addPoints(now, points);

    var ifindices = dump(AGENT, "ifindex").map((m) => parseInt(m.metricValue));
    ifindices.sort((a, b) => a - b);
    var ifindex_to_cardinal = [];
    ifindices.forEach((ifindex, i) => {
        ifindex_to_cardinal[ifindex] = i + 1;
    });
    var flows = [];
    var res = activeFlows(AGENT, 'booth-demo-switchports', 50, ifspeed * UTILIZATION) || [];
    var maxRate = Math.max(ifspeed, res.length ? res[0].value * 8 : 1);
    res.forEach((flow) => {
        var [src, dst] = flow.key.split(',');
        var src_idx = ifindex_to_cardinal[parseInt(src)];
        var dst_idx = ifindex_to_cardinal[parseInt(dst)];
        if (src_idx && dst_idx) {
            flows.push({source: src_idx, target: dst_idx, bps: flow.value * 8 / maxRate});
        }
    });
    switchFlows.flows = flows;
    switchFlows.nports = ifindices.length;
}, 1);

setHttpHandler((req) => {
    return {
        'title': TITLE,
        'keys': KEYS,
        'trend': req.query.after ? trend.after(parseInt(req.query.after)) : trend,
        'switchflows': switchFlows
    };
});
