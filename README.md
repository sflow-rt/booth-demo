# booth-demo

Real-time flow analytics to demonstrate Ethernet switches.

[Booth Demo](https://blog.sflow.com/2026/10/booth-demo.html)

## To install

1. [Download sFlow-RT](https://sflow-rt.com/download.php)
2. Run command: `sflow-rt/get-app.sh sflow-rt browse-flows`
3. Run command: `sflow-rt/get-app.sh sflow-rt browse-drops`
4. Run command: `sflow-rt/get-app.sh sflow-rt booth-demo`
5. Restart sFlow-RT

## Settings

| Property | Default | Description |
| -------- | ------- | ----------- |
| booth.agent | ALL | Set sFlow agent address |
| booth.keys | insource,ipdestination | [Flow keys](https://sflow-rt.com/define_flow.php) used to define flows in dashboard |
| booth.title | Live Switch Dashboard | Title in dashboard banner |

For documentation, tutorials, and community support, visit:
https://sFlow-RT.com
