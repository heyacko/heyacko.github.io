// Console vs Game Price Chart

let consoleSvg, consoleGroup, consoleData;

export function createConsoleChart() {
  // Data showing console and game prices in 2025 dollars
  consoleData = [
    { name: 'Game Boy\n(1998)', console: 177, game: 59 },
    { name: 'GBC\n(2000)', console: 149, game: 56 },
    { name: 'GBA\n(2003)', console: 174, game: 61 },
    { name: 'DS\n(2007)', console: 232, game: 54 },
    { name: 'DS\n(2011)', console: 214, game: 50 },
    { name: '3DS\n(2013)', console: 344, game: 55 },
    { name: '3DS\n(2016)', console: 227, game: 54 },
    { name: 'Switch\n(2019)', console: 377, game: 75 },
    { name: 'Switch\n(2022)', console: 329, game: 66 }
  ];
  
  const container = d3.select('#console-container');
  const width = container.node().clientWidth;
  const height = 500;
  
  const margin = { top: 60, right: 100, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Create scales
  const xScale = d3.scaleBand()
    .domain(consoleData.map(d => d.name))
    .range([0, chartWidth])
    .padding(0.3);
  
  const yScale = d3.scaleLinear()
    .domain([0, 400])
    .range([chartHeight, 0]);
  
  // Create SVG
  consoleSvg = d3.select('#console-chart')
    .attr('width', width)
    .attr('height', height);
  
  consoleGroup = consoleSvg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Add title
  consoleSvg.append('text')
    .attr('x', margin.left)
    .attr('y', 25)
    .attr('class', 'chart-title')
    .style('font-size', '18px')
    .style('font-weight', 'bold')
    .style('fill', 'var(--text-primary)')
    .text('Console vs Game Prices (Adjusted to 2025 Dollars)');
  
  consoleSvg.append('text')
    .attr('x', margin.left)
    .attr('y', 45)
    .style('font-size', '13px')
    .style('fill', 'var(--text-secondary)')
    .text('Games stayed flat. Consoles exploded.');
  
  // Add grid lines
  consoleGroup.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(yScale.ticks(5))
    .enter()
    .append('line')
    .attr('x1', 0)
    .attr('x2', chartWidth)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .style('stroke', 'var(--border-subtle)')
    .style('stroke-opacity', 0.3)
    .style('stroke-dasharray', '2,2');
  
  // Add Y axis
  const yAxis = d3.axisLeft(yScale)
    .ticks(5)
    .tickFormat(d => `$${d}`);
  
  consoleGroup.append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis)
    .selectAll('text')
    .style('fill', 'var(--text-secondary)')
    .style('font-size', '12px');
  
  // Add X axis
  const xAxis = d3.axisBottom(xScale);
  
  consoleGroup.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', 'var(--text-secondary)')
    .style('font-size', '11px')
    .style('text-anchor', 'middle');
  
  // Create groups for each generation
  const genGroups = consoleGroup.selectAll('.gen-group')
    .data(consoleData)
    .enter()
    .append('g')
    .attr('class', 'gen-group')
    .attr('transform', d => `translate(${xScale(d.name)},0)`);
  
  // Add console bars
  genGroups.append('rect')
    .attr('class', 'console-bar')
    .attr('x', 0)
    .attr('y', chartHeight)
    .attr('width', xScale.bandwidth() / 2 - 2)
    .attr('height', 0)
    .attr('rx', 4)
    .style('fill', 'var(--error)')
    .transition()
    .duration(1000)
    .delay((d, i) => i * 100)
    .ease(d3.easeCubicOut)
    .attr('y', d => yScale(d.console))
    .attr('height', d => chartHeight - yScale(d.console));
  
  // Add game bars
  genGroups.append('rect')
    .attr('class', 'game-bar')
    .attr('x', xScale.bandwidth() / 2 + 2)
    .attr('y', chartHeight)
    .attr('width', xScale.bandwidth() / 2 - 2)
    .attr('height', 0)
    .attr('rx', 4)
    .style('fill', 'var(--success)')
    .transition()
    .duration(1000)
    .delay((d, i) => i * 100 + 100)
    .ease(d3.easeCubicOut)
    .attr('y', d => yScale(d.game))
    .attr('height', d => chartHeight - yScale(d.game));
  
  // Add console price labels
  genGroups.append('text')
    .attr('class', 'console-label')
    .attr('x', xScale.bandwidth() / 4)
    .attr('y', d => yScale(d.console) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('font-weight', 'bold')
    .style('fill', 'var(--error)')
    .style('opacity', 0)
    .text(d => `$${d.console}`)
    .transition()
    .duration(400)
    .delay((d, i) => i * 100 + 1000)
    .style('opacity', 1);
  
  // Add game price labels
  genGroups.append('text')
    .attr('class', 'game-label')
    .attr('x', xScale.bandwidth() * 3 / 4)
    .attr('y', d => yScale(d.game) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('font-weight', 'bold')
    .style('fill', 'var(--success)')
    .style('opacity', 0)
    .text(d => `$${d.game}`)
    .transition()
    .duration(400)
    .delay((d, i) => i * 100 + 1100)
    .style('opacity', 1);
  
  // Add legend
  const legend = consoleSvg.append('g')
    .attr('transform', `translate(${width - margin.right + 10},${margin.top})`);
  
  legend.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 15)
    .attr('height', 15)
    .attr('rx', 2)
    .style('fill', 'var(--error)');
  
  legend.append('text')
    .attr('x', 20)
    .attr('y', 12)
    .style('font-size', '13px')
    .style('fill', 'var(--text-primary)')
    .text('Console');
  
  legend.append('rect')
    .attr('x', 0)
    .attr('y', 25)
    .attr('width', 15)
    .attr('height', 15)
    .attr('rx', 2)
    .style('fill', 'var(--success)');
  
  legend.append('text')
    .attr('x', 20)
    .attr('y', 37)
    .style('font-size', '13px')
    .style('fill', 'var(--text-primary)')
    .text('Game');
  
  // Add average line for games
  const avgGame = d3.mean(consoleData, d => d.game);
  consoleGroup.append('line')
    .attr('x1', 0)
    .attr('x2', chartWidth)
    .attr('y1', yScale(avgGame))
    .attr('y2', yScale(avgGame))
    .style('stroke', 'var(--success)')
    .style('stroke-width', '2px')
    .style('stroke-dasharray', '5,5')
    .style('opacity', 0)
    .transition()
    .duration(600)
    .delay(consoleData.length * 100 + 1500)
    .style('opacity', 0.7);
  
  consoleGroup.append('text')
    .attr('x', chartWidth + 5)
    .attr('y', yScale(avgGame))
    .attr('dy', '0.35em')
    .style('font-size', '11px')
    .style('fill', 'var(--success)')
    .style('opacity', 0)
    .text(`Avg: $${avgGame.toFixed(0)}`)
    .transition()
    .duration(400)
    .delay(consoleData.length * 100 + 1600)
    .style('opacity', 1);
}

export function resizeConsoleChart() {
  if (!consoleSvg || !consoleData) return;
  
  const container = d3.select('#console-container');
  const width = container.node().clientWidth;
  const height = 500;
  
  const margin = { top: 60, right: 100, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  const xScale = d3.scaleBand()
    .domain(consoleData.map(d => d.name))
    .range([0, chartWidth])
    .padding(0.3);
  
  const yScale = d3.scaleLinear()
    .domain([0, 400])
    .range([chartHeight, 0]);
  
  consoleSvg.attr('width', width).attr('height', height);
  
  consoleGroup.selectAll('.gen-group')
    .attr('transform', d => `translate(${xScale(d.name)},0)`);
  
  consoleGroup.selectAll('.console-bar')
    .attr('width', xScale.bandwidth() / 2 - 2)
    .attr('y', d => yScale(d.console))
    .attr('height', d => chartHeight - yScale(d.console));
  
  consoleGroup.selectAll('.game-bar')
    .attr('x', xScale.bandwidth() / 2 + 2)
    .attr('width', xScale.bandwidth() / 2 - 2)
    .attr('y', d => yScale(d.game))
    .attr('height', d => chartHeight - yScale(d.game));
  
  consoleGroup.select('.x-axis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(xScale));
  
  consoleGroup.selectAll('.grid line')
    .attr('x2', chartWidth)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d));
  
  const avgGame = d3.mean(consoleData, d => d.game);
  consoleGroup.selectAll('line')
    .filter(function() { return d3.select(this).style('stroke-dasharray') === '5, 5'; })
    .attr('x2', chartWidth)
    .attr('y1', yScale(avgGame))
    .attr('y2', yScale(avgGame));
}

