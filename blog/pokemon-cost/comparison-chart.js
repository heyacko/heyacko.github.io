// Comparison Line Chart - Pokemon vs Everyday Items

let comparisonSvg, comparisonGroup, comparisonData;

export async function createComparisonChart() {
  // Transform data into time series format
  const rawData = await d3.json('./comparisons-data.json');
  
  // Create line chart data
  comparisonData = [
    {
      name: 'Pokemon Games',
      color: 'var(--primary)',
      values: rawData.map(d => ({
        year: d.year,
        value: d.items.find(item => item.name.includes('Pokemon')).change
      }))
    },
    {
      name: 'Movie Tickets',
      color: 'var(--secondary)',
      values: rawData.map(d => ({
        year: d.year,
        value: d.items.find(item => item.name === 'Movie Ticket').change
      }))
    },
    {
      name: 'Gallon of Gas',
      color: 'var(--error)',
      values: rawData.map(d => ({
        year: d.year,
        value: d.items.find(item => item.name === 'Gallon of Gas').change
      }))
    },
    {
      name: 'Big Mac',
      color: 'var(--warning)',
      values: rawData.map(d => ({
        year: d.year,
        value: d.items.find(item => item.name === 'Big Mac').change
      }))
    }
  ];
  
  const container = d3.select('#comparison-container');
  const width = container.node().clientWidth;
  const height = 500;
  
  const margin = { top: 80, right: 140, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Create SVG
  comparisonSvg = d3.select('#comparison-chart')
    .attr('width', width)
    .attr('height', height);
  
  comparisonGroup = comparisonSvg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Add title
  comparisonSvg.append('text')
    .attr('x', margin.left)
    .attr('y', 25)
    .attr('class', 'chart-title')
    .style('font-size', '20px')
    .style('font-weight', 'bold')
    .style('fill', 'var(--text-primary)')
    .text('Everything Doubled: Pokemon Is Normal');
  
  comparisonSvg.append('text')
    .attr('x', margin.left)
    .attr('y', 50)
    .style('font-size', '14px')
    .style('fill', 'var(--text-secondary)')
    .text('Inflation-adjusted price increases (1998, 2007, 2019)');
  
  // Create scales
  const years = comparisonData[0].values.map(d => d.year);
  
  const xScale = d3.scalePoint()
    .domain(years)
    .range([0, chartWidth])
    .padding(0.5);
  
  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([chartHeight, 0]);
  
  // Add grid lines
  comparisonGroup.append('g')
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
  
  // Add axes
  const xAxis = d3.axisBottom(xScale);
  
  comparisonGroup.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(xAxis)
    .selectAll('text')
    .style('font-size', '14px')
    .style('fill', 'var(--text-secondary)');
  
  const yAxis = d3.axisLeft(yScale)
    .ticks(5)
    .tickFormat(d => `+${d}%`);
  
  comparisonGroup.append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis)
    .selectAll('text')
    .style('font-size', '13px')
    .style('fill', 'var(--text-secondary)');
  
  // Add axis labels
  comparisonGroup.append('text')
    .attr('x', chartWidth / 2)
    .attr('y', chartHeight + 45)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', 'var(--text-secondary)')
    .text('Year');
  
  comparisonGroup.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -chartHeight / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', 'var(--text-secondary)')
    .text('Price Increase Since Launch');
  
  // Create line generator
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);
  
  // Add lines for each item
  const lineGroups = comparisonGroup.selectAll('.line-group')
    .data(comparisonData)
    .enter()
    .append('g')
    .attr('class', 'line-group');
  
  // Add paths
  lineGroups.append('path')
    .attr('class', 'line-path')
    .attr('d', d => line(d.values))
    .style('fill', 'none')
    .style('stroke', d => d.color)
    .style('stroke-width', '3px')
    .style('opacity', 0)
    .transition()
    .duration(1000)
    .delay((d, i) => i * 200)
    .ease(d3.easeCubicOut)
    .style('opacity', 1);
  
  // Add dots at each data point
  lineGroups.each(function(lineData) {
    const group = d3.select(this);
    
    group.selectAll('.dot')
      .data(lineData.values)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.value))
      .attr('r', 0)
      .style('fill', lineData.color)
      .style('stroke', 'white')
      .style('stroke-width', '2px')
      .transition()
      .duration(400)
      .delay((d, i) => comparisonData.indexOf(lineData) * 200 + 800 + i * 100)
      .attr('r', 5);
    
    // Add value labels
    group.selectAll('.value-label')
      .data(lineData.values)
      .enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('x', d => xScale(d.year))
      .attr('y', d => yScale(d.value) - 12)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', lineData.color)
      .style('opacity', 0)
      .text(d => `+${d.value.toFixed(0)}%`)
      .transition()
      .duration(400)
      .delay((d, i) => comparisonData.indexOf(lineData) * 200 + 1000 + i * 100)
      .style('opacity', 1);
  });
  
  // Add legend
  const legend = comparisonSvg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - margin.right + 20},${margin.top + 20})`);
  
  const legendItems = legend.selectAll('.legend-item')
    .data(comparisonData)
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0,${i * 30})`);
  
  legendItems.append('line')
    .attr('x1', 0)
    .attr('x2', 30)
    .attr('y1', 0)
    .attr('y2', 0)
    .style('stroke', d => d.color)
    .style('stroke-width', '3px')
    .style('opacity', 0)
    .transition()
    .duration(400)
    .delay((d, i) => i * 200 + 1500)
    .style('opacity', 1);
  
  legendItems.append('text')
    .attr('x', 38)
    .attr('y', 0)
    .attr('dy', '0.35em')
    .style('font-size', '13px')
    .style('fill', 'var(--text-primary)')
    .style('opacity', 0)
    .text(d => d.name)
    .transition()
    .duration(400)
    .delay((d, i) => i * 200 + 1500)
    .style('opacity', 1);
  
  // Add insight callout
  setTimeout(() => {
    const callout = comparisonGroup.append('g')
      .attr('class', 'callout')
      .style('opacity', 0);
    
    callout.append('rect')
      .attr('x', chartWidth / 2 - 160)
      .attr('y', -15)
      .attr('width', 320)
      .attr('height', 40)
      .attr('rx', 8)
      .style('fill', 'var(--primary-alpha-20)')
      .style('stroke', 'var(--primary)')
      .style('stroke-width', '2px');
    
    callout.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', 8)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', 'var(--primary)')
      .text('All items doubled ~97%. Pokemon is normal inflation.');
    
    callout.transition()
      .duration(600)
      .style('opacity', 1);
  }, 3000);
}

export function resizeComparisonChart() {
  if (!comparisonSvg || !comparisonData) return;
  
  const container = d3.select('#comparison-container');
  const width = container.node().clientWidth;
  const height = 500;
  
  const margin = { top: 80, right: 140, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  comparisonSvg.attr('width', width);
  
  const years = comparisonData[0].values.map(d => d.year);
  
  const xScale = d3.scalePoint()
    .domain(years)
    .range([0, chartWidth])
    .padding(0.5);
  
  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([chartHeight, 0]);
  
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);
  
  comparisonGroup.selectAll('.line-path')
    .attr('d', d => line(d.values));
  
  comparisonGroup.selectAll('.dot')
    .attr('cx', d => xScale(d.year))
    .attr('cy', d => yScale(d.value));
  
  comparisonGroup.selectAll('.value-label')
    .attr('x', d => xScale(d.year))
    .attr('y', d => yScale(d.value) - 12);
  
  comparisonGroup.select('.x-axis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(xScale));
  
  comparisonGroup.selectAll('.grid line')
    .attr('x2', chartWidth)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d));
}
