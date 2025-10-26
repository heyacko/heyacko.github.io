// D3.js Chart for Pokemon Cost Visualization

let svg, data, xScale, yScale, chartGroup;
let currentStep = -1;

export function createChart(pokemonData) {
  data = pokemonData;
  
  // Get container dimensions
  const container = d3.select('#chart-container');
  const containerNode = container.node();
  const width = containerNode.clientWidth - 60;
  const height = containerNode.clientHeight - 100;
  
  // Set up margins
  const margin = { top: 20, right: 40, bottom: 60, left: 120 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Create SVG
  svg = d3.select('#chart')
    .attr('width', width)
    .attr('height', height);
  
  // Create chart group
  chartGroup = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Create scales
  const maxPrice = d3.max(data, d => Math.max(d.gamePrice, d.adjustedPrice));
  
  xScale = d3.scaleLinear()
    .domain([0, maxPrice * 1.1])
    .range([0, chartWidth]);
  
  yScale = d3.scaleBand()
    .domain(data.map(d => d.game))
    .range([0, chartHeight])
    .padding(0.3);
  
  // Create grid lines
  const grid = chartGroup.append('g')
    .attr('class', 'grid');
  
  grid.selectAll('line')
    .data(xScale.ticks(5))
    .enter()
    .append('line')
    .attr('x1', d => xScale(d))
    .attr('x2', d => xScale(d))
    .attr('y1', 0)
    .attr('y2', chartHeight)
    .style('stroke', 'var(--border-subtle)')
    .style('stroke-opacity', 0.3)
    .style('stroke-dasharray', '2,2');
  
  // Create X axis
  const xAxis = d3.axisBottom(xScale)
    .ticks(5)
    .tickFormat(d => `$${d}`);
  
  chartGroup.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', 'var(--text-secondary)')
    .style('font-size', '12px');
  
  // Create Y axis (initially empty)
  chartGroup.append('g')
    .attr('class', 'axis y-axis');
  
  // X axis label
  chartGroup.append('text')
    .attr('class', 'axis-label')
    .attr('x', chartWidth / 2)
    .attr('y', chartHeight + 45)
    .attr('text-anchor', 'middle')
    .style('fill', 'var(--text-secondary)')
    .text('Price (USD)');
  
  // Create groups for each game (initially hidden)
  const gameGroups = chartGroup.selectAll('.game-group')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'game-group')
    .attr('transform', d => `translate(0,${yScale(d.game)})`)
    .style('opacity', 0);
  
  // Add original price bars
  gameGroups.append('rect')
    .attr('class', 'bar-original')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 0)
    .attr('height', yScale.bandwidth() / 2)
    .attr('rx', 4);
  
  // Add adjusted price bars
  gameGroups.append('rect')
    .attr('class', 'bar-adjusted')
    .attr('x', 0)
    .attr('y', yScale.bandwidth() / 2)
    .attr('width', 0)
    .attr('height', yScale.bandwidth() / 2)
    .attr('rx', 4);
  
  // Add game labels
  gameGroups.append('text')
    .attr('class', 'game-label')
    .attr('x', -10)
    .attr('y', yScale.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .style('opacity', 0)
    .text(d => `${d.game} (${d.year})`);
  
  // Add price labels for original price
  gameGroups.append('text')
    .attr('class', 'price-label original')
    .attr('x', 5)
    .attr('y', yScale.bandwidth() / 4)
    .attr('dy', '0.35em')
    .style('font-size', '11px')
    .style('fill', 'var(--text-primary)')
    .style('opacity', 0);
  
  // Add price labels for adjusted price
  gameGroups.append('text')
    .attr('class', 'price-label adjusted')
    .attr('x', 5)
    .attr('y', yScale.bandwidth() * 3 / 4)
    .attr('dy', '0.35em')
    .style('font-size', '11px')
    .style('fill', 'white')
    .style('opacity', 0);
  
  // Add tooltips on hover
  gameGroups.selectAll('rect')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .style('opacity', 0.8);
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .style('opacity', 1);
    });
  
  // Store references
  window.gameGroups = gameGroups;
}

export function updateChart(stepIndex) {
  if (stepIndex === currentStep || !window.gameGroups) return;
  
  currentStep = stepIndex;
  const numGamesToShow = stepIndex + 1;
  
  // Update each game group
  window.gameGroups.each(function(d, i) {
    const group = d3.select(this);
    
    if (i < numGamesToShow) {
      // Show this game with staggered animation
      const delay = i * 150;
      
      // Fade in the group
      group.transition()
        .duration(400)
        .delay(delay)
        .style('opacity', 1);
      
      // Animate original price bar
      group.select('.bar-original')
        .transition()
        .duration(800)
        .delay(delay)
        .ease(d3.easeCubicOut)
        .attr('width', xScale(d.gamePrice));
      
      // Animate adjusted price bar
      group.select('.bar-adjusted')
        .transition()
        .duration(800)
        .delay(delay + 100)
        .ease(d3.easeCubicOut)
        .attr('width', xScale(d.adjustedPrice));
      
      // Fade in game label
      group.select('.game-label')
        .transition()
        .duration(400)
        .delay(delay)
        .style('opacity', 1);
      
      // Animate price labels with counting effect
      const originalLabel = group.select('.price-label.original');
      const adjustedLabel = group.select('.price-label.adjusted');
      
      // Fade in labels
      originalLabel
        .transition()
        .duration(400)
        .delay(delay + 400)
        .style('opacity', 1);
      
      adjustedLabel
        .transition()
        .duration(400)
        .delay(delay + 500)
        .style('opacity', 1);
      
      // Animate numbers counting up
      originalLabel
        .transition()
        .duration(800)
        .delay(delay + 400)
        .tween('text', function() {
          const interpolate = d3.interpolateNumber(0, d.gamePrice);
          return function(t) {
            this.textContent = `$${interpolate(t).toFixed(2)}`;
          };
        });
      
      adjustedLabel
        .transition()
        .duration(800)
        .delay(delay + 500)
        .tween('text', function() {
          const interpolate = d3.interpolateNumber(0, d.adjustedPrice);
          return function(t) {
            this.textContent = `$${interpolate(t).toFixed(2)}`;
          };
        });
    } else if (i === numGamesToShow) {
      // Current step - pulse effect
      group.select('.bar-adjusted')
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .attr('opacity', 0.7)
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .attr('opacity', 1);
    }
  });
  
  // Update Y axis to show labels for visible games
  const visibleGames = data.slice(0, numGamesToShow).map(d => d.game);
  const yAxis = d3.axisLeft(yScale)
    .tickValues(visibleGames)
    .tickFormat(''); // We're using custom labels
  
  chartGroup.select('.y-axis')
    .transition()
    .duration(400)
    .call(yAxis)
    .selectAll('text')
    .style('fill', 'var(--text-primary)')
    .style('font-size', '14px');
}

// Handle window resize
window.addEventListener('resize', () => {
  if (data && svg) {
    // Clear and recreate chart
    d3.select('#chart').selectAll('*').remove();
    createChart(data);
    if (currentStep >= 0) {
      updateChart(currentStep);
    }
  }
});

