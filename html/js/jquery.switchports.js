(function ($) {
    "use strict";
    $.widget("inmon.switchflows", {
        options: {
            maxBps: 10000000000, // 10 Gbps baseline for max stroke thickness
            maxThickness: 16, // Max arc stroke width in pixels
            minThickness: 1.5, // Min arc stroke width for visible active flows
            forwardColor: {r: 56, g: 189, b: 248}, // Sky blue
            reverseColor: {r: 244, g: 63, b: 94}, // Rose/Crimson
            axisColor: "#475569",
            labelColor: "#94a3b8",
            activeLabelColor: "#38bdf8"
        },

        // Constructor sequence
        _create: function () {
            this.element.addClass("ui-switch-flows");

            // Append Canvas element dynamically
            this.canvas = $("<canvas>").appendTo(this.element)[0];
            this.ctx = this.canvas.getContext("2d");

            this.flows = {flows: [], nports: 1};
            this.activePorts = new Set();

            // Handle window resizing cleanly
            this._on(window, {
                resize: function () {
                    this.resize();
                }
            });

            this.resize();
        },

        resize: function () {
            const width = this.element.width();
            const height = this.element.height();

            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.canvas.style.width = width + "px";
            this.canvas.style.height = height + "px";
            this.ctx.scale(dpr, dpr);

            this.width = width;
            this.height = height;

            this.update(this.flows);
        },

        update: function (newFlows) {
            this.flows = newFlows || {flows: [], nports: 1};

            this.activePorts.clear();
            this.flows.flows.forEach(flow => {
                this.activePorts.add(flow.source);
                this.activePorts.add(flow.target);
            });

            this._render();
        },

        _render: function () {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            const paddingX = 50;
            const centerY = this.height / 2;
            const availableWidth = this.width - (paddingX * 2);
            const stepX = availableWidth / (this.flows.nports - 1);

            const portXCoords = [];
            for (let i = 0; i < this.flows.nports; i++) {
                portXCoords.push(paddingX + (i * stepX));
            }

            this.flows.flows.forEach(flow => {
                const srcIdx = flow.source - 1;
                const tgtIdx = flow.target - 1;

                if (srcIdx < 0 || srcIdx >= this.flows.nports || tgtIdx < 0 || tgtIdx >= this.flows.nports) {
                    return;
                }

                const x1 = portXCoords[srcIdx];
                const x2 = portXCoords[tgtIdx];

                let thickness = (flow.bps / this.options.maxBps) * this.options.maxThickness;
                thickness = Math.max(this.options.minThickness, Math.min(thickness, this.options.maxThickness));

                const isForward = flow.source < flow.target;
                ctx.lineWidth = thickness;

                const centerX = (x1 + x2) / 2;
                const radiusX = Math.abs(x2 - x1) / 2;

                const maxAllowedRadiusY = (this.height / 2) * 0.85;
                const radiusY = Math.min(radiusX * 0.6, maxAllowedRadiusY);

                const rgb = isForward ? this.options.forwardColor : this.options.reverseColor;
                const grad = ctx.createLinearGradient(x1, centerY, x2, centerY);
                grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
                grad.addColorStop(0.2, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
                grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1.0)`);
                ctx.strokeStyle = grad;
                ctx.beginPath();
                if (isForward) {
                    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, Math.PI, 0, false);
                } else {
                    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI, false);
                }
                ctx.stroke();
            });

            ctx.strokeStyle = this.options.axisColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(paddingX - 20, centerY);
            ctx.lineTo(this.width - paddingX + 20, centerY);
            ctx.stroke();

            for (let i = 0; i < this.flows.nports; i++) {
                const x = portXCoords[i];
                const portNum = i + 1;
                const isActive = this.activePorts.has(portNum);

                ctx.fillStyle = isActive ? "#ffffff" : "#334155";
                ctx.beginPath();
                ctx.arc(x, centerY, isActive ? 5 : 4, 0, 2 * Math.PI);
                ctx.fill();

                if (isActive) {
                    ctx.strokeStyle = this.options.activeLabelColor;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                ctx.fillStyle = isActive ? this.options.activeLabelColor : this.options.labelColor;
                ctx.font = isActive ? "bold 11px sans-serif" : "10px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                const textOffset = (i % 2 === 0) ? -16 : 16;
                ctx.fillText(portNum, x, centerY + textOffset);
            }
        },

        _destroy: function () {
            this.canvas.remove();
            this.element.removeClass("ui-switch-flows");
        }
    });
})(jQuery);
