document.addEventListener('DOMContentLoaded', function() {
    const svg = d3.select('#coordinate-system');
    const width = svg.node().getBoundingClientRect().width;
    const height = +svg.attr('height') || 400;
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
        .call(d3.axisLeft(yScale).tickValues([0, 0.5, 1]))
        .append('text')
        .attr('fill', '#000')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -50)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Animation Progress');

    g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickValues([0, 0.5, 1]))
        .append('text')
        .attr('fill', '#000')
        .attr('x', innerWidth / 2)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Normalized Animation Time');

    g.selectAll('.tick text')
        .style('font-size', '12px')
        .style('font-weight', 'normal')
        .attr('dy', '0.35em');

    const line = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]));

    const easingFunctions = {
        linear: d3.easeLinear,
        easeQuadIn: d3.easeQuadIn,
        easeQuadOut: d3.easeQuadOut,
        easeQuadInOut: d3.easeQuadInOut,
        easeExpIn: d3.easeExpIn,
        easeExpOut: d3.easeExpOut,
        easeExpInOut: d3.easeExpInOut,
        easeBounceIn: d3.easeBounceIn,
        // Add more easing functions as needed
    };

    // Populate the dropdown dynamically from the easingFunctions object keys
    const easingSelect = d3.select('#easing-select');
    easingSelect.selectAll('option')
        .data(Object.keys(easingFunctions))
        .enter()
        .append('option')
        .attr('value', d => d)
        .text(d => d);

    let currentEasing = easingFunctions.linear;

    function updateEasingFunction(easing) {
        currentEasing = easingFunctions[easing];
        const data = d3.range(0, 1.01, 0.01).map(t => [t, currentEasing(t)]);
        
        const path = g.selectAll('.line').data([data]);

        path.enter()
            .append('path')
            .attr('class', 'line')
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 2)
            .merge(path)
            .transition()
            .duration(500)
            .attr('d', line);

        path.exit().remove();

        // Restart the animation
        animate();
    }

    d3.select('#easing-select').on('change', function() {
        updateEasingFunction(this.value);
    });

    const colorPatch = d3.select('#color-patch');

    // Add a line connecting the two points starting at x = 0 and y = 0
    const xConnectingLine = g.append('line')
        .attr('stroke', 'gray')
        .attr('stroke-dasharray', '5,5')
        .attr('x1', xScale(0))
        .attr('y1', yScale(0))
        .attr('x2', xScale(0))
        .attr('y2', yScale(0));

    // Add a line connecting the y-axis point to the easing line
    const yConnectingLine = g.append('line')
        .attr('stroke', 'gray')
        .attr('stroke-dasharray', '5,5')
        .attr('x1', xScale(0))
        .attr('y1', yScale(0))
        .attr('x2', xScale(0))
        .attr('y2', yScale(0));

    // Add a circle element to the SVG for the moving point
    const movingPoint = g.append('circle')
        .attr('r', 5)
        .attr('fill', 'blue');

    // Add a second point that moves at constant speed along the x-axis
    const xAxisPoint = g.append('circle')
        .attr('cx', xScale(0))
        .attr('cy', yScale(0))
        .attr('r', 5)
        .attr('fill', 'blue');

    // Add a third point that moves at constant speed along the y-axis
    const yAxisPoint = g.append('circle')
        .attr('cx', xScale(0))
        .attr('cy', yScale(0))
        .attr('r', 5)
        .attr('fill', 'blue');

    // Add a circle element to the new SVG for the spinning dot
    const circleDotSvg = d3.select('#circle-dot-svg');
    const spinningDot = circleDotSvg.append('circle')
        .attr('r', 10)
        .attr('fill', 'black')
        .attr('cx', 200)
        .attr('cy', 200);

    function animate() {
        let duration = 2000;

        spinningDot.transition()
            .duration(duration)
            .ease(currentEasing)
            .attrTween('transform', () => t => {
                const angle = t * 2 * Math.PI;
                const x = 200 + 100 * Math.cos(angle);
                const y = 200 + 100 * Math.sin(angle);
                return `translate(${x - 200}, ${y - 200})`;
            })
            .on('end', animate);

        colorPatch.transition()
            .duration(duration)
            .ease(currentEasing)
            .styleTween('background-color', () => t => d3.interpolateRgb('blue', 'orange')(t));

        movingPoint.transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .attrTween('cx', () => t => xScale(t))
            .attrTween('cy', () => t => yScale(currentEasing(t)));

        xAxisPoint.transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .attrTween('cx', () => t => xScale(t))
            .attr('cy', yScale(0));

        xConnectingLine.transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .attrTween('x1', () => t => xScale(t))
            .attr('y1', yScale(0))
            .attrTween('x2', () => t => xScale(t))
            .attrTween('y2', () => t => yScale(currentEasing(t)));

        yAxisPoint.transition()
            .duration(duration)
            .ease(currentEasing)
            .attr('cx', xScale(0))
            .attrTween('cy', () => t => yScale(t));

        yConnectingLine.transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .attr('x1', xScale(0))
            .attrTween('y1', () => t => yScale(currentEasing(t)))
            .attrTween('x2', () => t => xScale(t))
            .attrTween('y2', () => t => yScale(currentEasing(t)));
    }

    updateEasingFunction('linear');
    animate();
});
