// ============================================================================
// Pokemon Cost Blog Post - Consolidated Chart Visualizations
// ============================================================================
// This file contains all chart visualizations for the Pokemon Cost blog post:
// - Interactive Guessing Chart (guess.js functionality)
// - Comparison Line Chart (comparison-chart.js functionality)
// - Console vs Game Price Chart (console-chart.js functionality)
// ============================================================================

// ============================================================================
// GUESS CHART - Interactive Guessing Component for Pokemon Prices
// ============================================================================

let guessData, guessSvg, guessGroup, xScale, yScale;
let currentGameIndex = 0;
let userGuesses = [];
let allRevealed = false;
let currentBrush = null;

export function createGuessChart(pokemonData) {
  guessData = pokemonData.map(d => ({
    ...d,
    guess: d.gamePrice, // Start at original price
    revealed: false,
    guessed: false
  }));
  
  const container = d3.select('#guess-container');
  const width = container.node().clientWidth;
  const height = 500;
  
  const margin = { top: 80, right: 60, bottom: 80, left: 20 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Create scales
  xScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, chartWidth]);
  
  yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, chartHeight]);
  
  // Create SVG
  guessSvg = d3.select('#guess-chart')
    .attr('width', width)
    .attr('height', height);
  
  guessGroup = guessSvg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Add game icon
  guessSvg.append('image')
    .attr('id', 'game-icon')
    .attr('x', width / 2 - 30)
    .attr('y', 20)
    .attr('width', 60)
    .attr('height', 60)
    .style('opacity', 0.9);
  
  // Add instruction text
  guessSvg.append('text')
    .attr('id', 'game-title')
    .attr('x', width / 2)
    .attr('y', 100)
    .attr('text-anchor', 'middle')
    .style('font-size', '20px')
    .style('font-weight', 'bold')
    .style('fill', 'var(--text-primary)');
  
  guessSvg.append('text')
    .attr('id', 'game-subtitle')
    .attr('x', width / 2)
    .attr('y', 125)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('fill', 'var(--text-secondary)');
  
  // Add grid lines
  guessGroup.append('g')
    .attr('class', 'grid')
    .selectAll('line')
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
  
  // Add X axis
  const xAxis = d3.axisBottom(xScale)
    .ticks(5)
    .tickFormat(d => `$${d}`);
  
  guessGroup.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', 'var(--text-secondary)')
    .style('font-size', '14px');
  
  guessGroup.append('text')
    .attr('x', chartWidth / 2)
    .attr('y', chartHeight + 50)
    .attr('text-anchor', 'middle')
    .style('font-size', '13px')
    .style('fill', 'var(--text-secondary)')
    .text('Drag the slider to guess the inflation-adjusted 2025 price');
  
  // Create track bar
  guessGroup.append('rect')
    .attr('class', 'track-bar')
    .attr('x', 0)
    .attr('y', chartHeight * 0.35)
    .attr('width', chartWidth)
    .attr('height', chartHeight * 0.3)
    .attr('rx', 8)
    .style('fill', 'var(--white-alpha-20)')
    .style('stroke', 'var(--border-subtle)')
    .style('stroke-width', '2px');
  
  // Create guess bar
  guessGroup.append('rect')
    .attr('id', 'guess-bar')
    .attr('x', 0)
    .attr('y', chartHeight * 0.35)
    .attr('width', xScale(guessData[0].gamePrice))
    .attr('height', chartHeight * 0.3)
    .attr('rx', 8)
    .style('fill', 'var(--primary-alpha-40)')
    .style('stroke', 'var(--primary)')
    .style('stroke-width', '3px');
  
  // Create actual bar (hidden initially)
  guessGroup.append('rect')
    .attr('id', 'actual-bar')
    .attr('x', 0)
    .attr('y', chartHeight * 0.35)
    .attr('width', 0)
    .attr('height', chartHeight * 0.3)
    .attr('rx', 8)
    .style('fill', 'var(--secondary)')
    .style('opacity', 0);
  
  // Add price label
  guessGroup.append('text')
    .attr('id', 'guess-label')
    .attr('x', xScale(guessData[0].gamePrice))
    .attr('y', chartHeight * 0.5)
    .attr('dy', '0.35em')
    .attr('dx', '15')
    .style('font-size', '24px')
    .style('font-weight', 'bold')
    .style('fill', 'var(--primary)')
    .text(`$${guessData[0].gamePrice.toFixed(0)}`);
  
  // Add actual label (hidden initially)
  guessGroup.append('text')
    .attr('id', 'actual-label')
    .attr('x', 0)
    .attr('y', chartHeight * 0.2)
    .attr('text-anchor', 'middle')
    .style('font-size', '20px')
    .style('font-weight', 'bold')
    .style('fill', 'var(--secondary)')
    .style('opacity', 0);
  
  // Add difference label (hidden initially)
  guessGroup.append('text')
    .attr('id', 'diff-label')
    .attr('x', chartWidth / 2)
    .attr('y', chartHeight * 0.8)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('opacity', 0);
  
  // Create brush for slider
  const brush = d3.brushX()
    .extent([[0, chartHeight * 0.35], [chartWidth, chartHeight * 0.65]])
    .on('brush', handleBrush)
    .on('end', handleBrushEnd);
  
  currentBrush = guessGroup.append('g')
    .attr('class', 'brush')
    .call(brush)
    .call(brush.move, [0, xScale(guessData[0].gamePrice)]);
  
  // Style brush with more obvious handle
  d3.select('.brush .selection')
    .style('fill', 'none')
    .style('stroke', 'none')
    .style('pointer-events', 'none'); // Disable selection dragging
  
  d3.select('.brush .handle--e')
    .style('fill', 'var(--primary)')
    .style('stroke', 'white')
    .style('stroke-width', '3px')
    .style('rx', '4px')
    .style('cursor', 'ew-resize')
    .style('width', '12px')
    .attr('width', 12);
  
  d3.select('.brush .handle--w').remove();
  
  // Also disable the overlay from creating new selections
  d3.select('.brush .overlay')
    .style('pointer-events', 'none');
  
  // Add drag icon to handle
  const handleGroup = guessGroup.append('g')
    .attr('class', 'handle-icon')
    .attr('transform', `translate(${xScale(guessData[0].gamePrice)},${chartHeight * 0.5})`)
    .style('pointer-events', 'none'); // Don't block brush interaction
  
  handleGroup.append('circle')
    .attr('r', 20)
    .style('fill', 'var(--primary)')
    .style('stroke', 'white')
    .style('stroke-width', '3px')
    .style('filter', 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))')
    .style('pointer-events', 'none');
  
  handleGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .style('font-size', '16px')
    .style('fill', 'white')
    .style('pointer-events', 'none')
    .text('↔');
  
  // Show first game
  showGame(0);
}

function showGame(index) {
  if (index >= guessData.length) return;
  
  const game = guessData[index];
  
  // Update game icon
  guessSvg.select('#game-icon')
    .attr('href', game.icon);
  
  guessSvg.select('#game-title')
    .text(`${game.game} (${game.year})`);
  
  guessSvg.select('#game-subtitle')
    .text(`Original price: $${game.gamePrice.toFixed(2)} | Platform: ${game.platform}`);
  
  // Reset guess bar
  guessGroup.select('#guess-bar')
    .attr('width', xScale(game.guess))
    .style('opacity', 1);
  
  guessGroup.select('#guess-label')
    .attr('x', xScale(game.guess))
    .text(`$${game.guess.toFixed(0)}`);
  
  // Update handle icon position
  const chartHeight = yScale.range()[1];
  guessGroup.select('.handle-icon')
    .attr('transform', `translate(${xScale(game.guess)},${chartHeight * 0.5})`);
  
  // Hide actual bar
  guessGroup.select('#actual-bar')
    .attr('width', 0)
    .style('opacity', 0);
  
  guessGroup.select('#actual-label')
    .style('opacity', 0);
  
  guessGroup.select('#diff-label')
    .style('opacity', 0);
  
  // Reset brush
  if (currentBrush) {
    currentBrush.call(d3.brushX().move, [0, xScale(game.guess)]);
  }
  
  // Show submit button
  d3.select('#submit-guess')
    .text('Submit Guess')
    .attr('disabled', null);
  
  d3.select('#skip-all-container').style('display', 'none');
  d3.select('#guess-summary').style('display', 'none');
}

function handleBrush(event) {
  if (!event.selection || allRevealed) return;
  
  const [x0, x1] = event.selection;
  const value = Math.round(xScale.invert(x1));
  const clampedValue = Math.max(0, Math.min(100, value));
  
  guessData[currentGameIndex].guess = clampedValue;
  
  // Update guess bar and label
  guessGroup.select('#guess-bar')
    .attr('width', xScale(clampedValue));
  
  guessGroup.select('#guess-label')
    .attr('x', xScale(clampedValue))
    .text(`$${clampedValue.toFixed(0)}`);
  
  // Update handle icon position
  const chartHeight = yScale.range()[1];
  guessGroup.select('.handle-icon')
    .attr('transform', `translate(${xScale(clampedValue)},${chartHeight * 0.5})`);
}

function handleBrushEnd(event) {
  if (!event.selection || allRevealed) return;
  
  const [x0, x1] = event.selection;
  const value = Math.round(xScale.invert(x1));
  const clampedValue = Math.max(0, Math.min(100, value));
  
  guessData[currentGameIndex].guess = clampedValue;
  
  // Snap to value
  if (currentBrush) {
    currentBrush.call(d3.brushX().move, [0, xScale(clampedValue)]);
  }
}

export function submitGuess() {
  if (allRevealed) return;
  
  const game = guessData[currentGameIndex];
  game.guessed = true;
  game.revealed = true;
  userGuesses.push({
    game: game.game,
    guess: game.guess,
    actual: game.adjustedPrice,
    diff: game.guess - game.adjustedPrice
  });
  
  // Disable brush
  if (currentBrush) {
    currentBrush.on('.brush', null);
  }
  
  // Make guess bar translucent
  guessGroup.select('#guess-bar')
    .transition()
    .duration(400)
    .style('opacity', 0.3);
  
  // Reveal actual bar
  guessGroup.select('#actual-bar')
    .transition()
    .duration(800)
    .ease(d3.easeCubicOut)
    .attr('width', xScale(game.adjustedPrice))
    .style('opacity', 1);
  
  // Show actual label
  guessGroup.select('#actual-label')
    .attr('x', xScale(game.adjustedPrice))
    .text(`Actual: $${game.adjustedPrice.toFixed(2)}`)
    .transition()
    .duration(400)
    .delay(400)
    .style('opacity', 1);
  
  // Show difference
  const diff = game.guess - game.adjustedPrice;
  const diffText = Math.abs(diff) < 2 ? '🎯 Very close!' :
                   diff > 0 ? `📈 $${diff.toFixed(0)} too high` :
                   `📉 $${Math.abs(diff).toFixed(0)} too low`;
  
  guessGroup.select('#diff-label')
    .text(diffText)
    .style('fill', Math.abs(diff) < 2 ? 'var(--success)' : 
           diff > 0 ? 'var(--error)' : 'var(--primary)')
    .transition()
    .duration(400)
    .delay(600)
    .style('opacity', 1);
  
  // Update buttons - change Submit to "Guess Another Game?"
  setTimeout(() => {
    if (currentGameIndex < guessData.length - 1) {
      const submitBtn = document.getElementById('submit-guess');
      
      // Remove old event listener by cloning the button
      const newSubmitBtn = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
      
      // Set new text and add new event listener
      newSubmitBtn.textContent = 'Guess Another Game? →';
      newSubmitBtn.disabled = false;
      newSubmitBtn.addEventListener('click', guessAnother);
      
      d3.select('#skip-all-container').style('display', 'block');
    } else {
      // Last game guessed - show the bar chart with all games
      allRevealed = true;
      showStackedBarChart();
      showFinalSummary();
    }
  }, 1000);
}

export function guessAnother() {
  currentGameIndex++;
  
  if (currentGameIndex >= guessData.length) {
    showFinalSummary();
    return;
  }
  
  // Reset button back to Submit Guess
  const submitBtn = document.getElementById('submit-guess');
  
  // Remove old event listener by cloning the button
  const newSubmitBtn = submitBtn.cloneNode(true);
  submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
  
  // Set new text and add new event listener
  newSubmitBtn.textContent = 'Submit Guess';
  newSubmitBtn.disabled = false;
  newSubmitBtn.addEventListener('click', submitGuess);
  
  d3.select('#skip-all-container').style('display', 'none');
  
  // Reset brush
  const chartWidth = xScale.range()[1];
  const chartHeight = yScale.range()[1];
  
  const brush = d3.brushX()
    .extent([[0, chartHeight * 0.35], [chartWidth, chartHeight * 0.65]])
    .on('brush', handleBrush)
    .on('end', handleBrushEnd);
  
  // Reset guess to original price for the new game
  guessData[currentGameIndex].guess = guessData[currentGameIndex].gamePrice;
  
  currentBrush = guessGroup.select('.brush')
    .call(brush)
    .call(brush.move, [0, xScale(guessData[currentGameIndex].gamePrice)]);
  
  d3.select('.brush .selection')
    .style('fill', 'none')
    .style('stroke', 'none')
    .style('pointer-events', 'none');
  
  d3.select('.brush .overlay')
    .style('pointer-events', 'none');
  
  d3.select('.brush .handle--w').remove();
  
  d3.select('.brush .handle--e')
    .style('fill', 'var(--primary)')
    .style('stroke', 'white')
    .style('stroke-width', '3px');
  
  showGame(currentGameIndex);
}

export function skipToEnd() {
  allRevealed = true;
  
  // Mark remaining games as not guessed but revealed
  for (let i = currentGameIndex; i < guessData.length; i++) {
    guessData[i].revealed = true;
    guessData[i].guessed = false;
  }
  
  showStackedBarChart();
  showFinalSummary();
}

function showStackedBarChart() {
  // Hide buttons
  d3.select('#submit-guess').style('display', 'none');
  d3.select('#skip-all-container').style('display', 'none');
  
  // Clear existing chart
  guessGroup.selectAll('*').remove();
  guessSvg.selectAll('text').remove();
  guessSvg.select('#game-icon').remove();
  
  const container = d3.select('#guess-container');
  const width = container.node().clientWidth;
  const height = Math.max(600, guessData.length * 60);
  
  const margin = { top: 60, right: 100, bottom: 60, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Update SVG size
  guessSvg.attr('height', height);
  guessGroup.attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Add title
  guessSvg.append('text')
    .attr('x', margin.left)
    .attr('y', 30)
    .attr('text-anchor', 'start')
    .style('font-size', '18px')
    .style('font-weight', 'bold')
    .style('fill', 'var(--text-primary)')
    .text('All Pokemon Games: Actual vs Inflation-Adjusted Prices');
  
  // Create scales
  const yScaleBar = d3.scaleBand()
    .domain(guessData.map(d => d.game))
    .range([0, chartHeight])
    .padding(0.3);
  
  const xScaleBar = d3.scaleLinear()
    .domain([0, 80])
    .range([0, chartWidth]);
  
  // Add grid lines
  guessGroup.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(xScaleBar.ticks(5))
    .enter()
    .append('line')
    .attr('x1', d => xScaleBar(d))
    .attr('x2', d => xScaleBar(d))
    .attr('y1', 0)
    .attr('y2', chartHeight)
    .style('stroke', 'var(--border-subtle)')
    .style('stroke-opacity', 0.3)
    .style('stroke-dasharray', '2,2');
  
  // Add X axis
  const xAxis = d3.axisBottom(xScaleBar)
    .ticks(5)
    .tickFormat(d => `$${d}`);
  
  guessGroup.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', 'var(--text-secondary)')
    .style('font-size', '12px');
  
  // Add Y axis (hide text labels, only show icons)
  const yAxis = d3.axisLeft(yScaleBar)
    .tickSize(0) // Hide tick marks
    .tickFormat(''); // Don't show any text labels
  
  guessGroup.append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis)
    .select('.domain').remove(); // Remove the axis line
  
  // Create game groups
  const gameGroups = guessGroup.selectAll('.game-bar-group')
    .data(guessData)
    .enter()
    .append('g')
    .attr('class', 'game-bar-group')
    .attr('transform', d => `translate(0,${yScaleBar(d.game)})`);
  
  // Add game icons next to Y axis
  gameGroups.append('image')
    .attr('x', -55)
    .attr('y', yScaleBar.bandwidth() / 2 - 15)
    .attr('width', 30)
    .attr('height', 30)
    .attr('href', d => d.icon)
    .style('opacity', 0)
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .style('opacity', 0.9);
  
  // Add actual price bars (lighter purple)
  gameGroups.append('rect')
    .attr('class', 'actual-price-bar')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 0)
    .attr('height', yScaleBar.bandwidth())
    .attr('rx', 4)
    .style('fill', 'var(--primary-alpha-40)')
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .ease(d3.easeCubicOut)
    .attr('width', d => xScaleBar(d.gamePrice));
  
  // Add inflation difference bars (stacked on top, darker purple)
  gameGroups.append('rect')
    .attr('class', 'inflation-diff-bar')
    .attr('x', d => xScaleBar(d.gamePrice))
    .attr('y', 0)
    .attr('width', 0)
    .attr('height', yScaleBar.bandwidth())
    .attr('rx', 4)
    .style('fill', 'var(--secondary)')
    .transition()
    .duration(800)
    .delay((d, i) => i * 100 + 400)
    .ease(d3.easeCubicOut)
    .attr('width', d => xScaleBar(d.adjustedPrice - d.gamePrice));
  
  // Add actual price labels
  gameGroups.append('text')
    .attr('class', 'price-label-bar')
    .attr('x', d => xScaleBar(d.gamePrice) / 2)
    .attr('y', yScaleBar.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('font-weight', 'bold')
    .style('fill', 'var(--primary-dark)')
    .style('opacity', 0)
    .text(d => `$${d.gamePrice.toFixed(0)}`)
    .transition()
    .duration(400)
    .delay((d, i) => i * 100 + 800)
    .style('opacity', 1);
  
  // Add total adjusted price labels
  gameGroups.append('text')
    .attr('class', 'adjusted-label-bar')
    .attr('x', d => xScaleBar(d.adjustedPrice) + 10)
    .attr('y', yScaleBar.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .style('fill', 'var(--secondary)')
    .style('opacity', 0)
    .text(d => `$${d.adjustedPrice.toFixed(2)}`)
    .transition()
    .duration(400)
    .delay((d, i) => i * 100 + 1200)
    .style('opacity', 1);
  
  // Add legend
  const legend = guessSvg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${margin.left},${height - 40})`);
  
  legend.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 20)
    .attr('height', 15)
    .attr('rx', 3)
    .style('fill', 'var(--primary-alpha-40)');
  
  legend.append('text')
    .attr('x', 28)
    .attr('y', 12)
    .style('font-size', '13px')
    .style('fill', 'var(--text-primary)')
    .text('Original Price');
  
  legend.append('rect')
    .attr('x', 150)
    .attr('y', 0)
    .attr('width', 20)
    .attr('height', 15)
    .attr('rx', 3)
    .style('fill', 'var(--secondary)');
  
  legend.append('text')
    .attr('x', 178)
    .attr('y', 12)
    .style('font-size', '13px')
    .style('fill', 'var(--text-primary)')
    .text('Inflation Increase to 2025');
  
  // Show summary after animation
  setTimeout(() => {
    showFinalSummary();
  }, guessData.length * 100 + 1500);
}

function showFinalSummary() {
  allRevealed = true;
  
  d3.select('#submit-guess').style('display', 'none');
  d3.select('#guess-another').style('display', 'none');
  d3.select('#skip-all').style('display', 'none');
  
  const summary = d3.select('#guess-summary');
  const guessedGames = userGuesses.length;
  
  let message = '';
  let calloutClass = 'callout callout--info';
  
  if (guessedGames === 0) {
    message = `<strong>You skipped all the guesses!</strong> Let's show you what you missed...`;
    calloutClass = 'callout callout--warning';
  } else if (guessedGames === guessData.length) {
    const avgDiff = d3.mean(userGuesses, d => Math.abs(d.diff));
    const overestimated = userGuesses.filter(d => d.diff > 5).length;
    
    if (avgDiff < 5) {
      message = `<strong>🎯 Impressive!</strong> You guessed all ${guessedGames} games with an average error of only $${avgDiff.toFixed(2)}.`;
      calloutClass = 'callout callout--success';
    } else if (overestimated > guessedGames / 2) {
      message = `You overestimated ${overestimated} out of ${guessedGames} games. <strong>Most people think games got more expensive than they actually did.</strong> Let's see why...`;
      calloutClass = 'callout callout--warning';
    } else {
      message = `You guessed ${guessedGames} games! <strong>Here's what the data actually shows...</strong>`;
    }
  } else {
    const avgDiff = d3.mean(userGuesses, d => Math.abs(d.diff));
    message = `You guessed ${guessedGames} out of ${guessData.length} games. Average error: $${avgDiff.toFixed(2)}. <strong>Here's the truth...</strong>`;
  }
  
  summary.attr('class', calloutClass)
    .html(message)
    .style('display', 'block')
    .style('opacity', 0)
    .transition()
    .duration(600)
    .style('opacity', 1);
  
  d3.select('#continue-reading')
    .style('display', 'block')
    .style('opacity', 0)
    .transition()
    .duration(400)
    .delay(800)
    .style('opacity', 1);
}

export function resizeGuessChart() {
  // Simple resize - would need full reimplementation for proper responsive behavior
  if (!guessSvg || !guessData) return;
  
  const container = d3.select('#guess-container');
  const width = container.node().clientWidth;
  
  guessSvg.attr('width', width);
  
  // Recalculate scales and reposition elements
  const margin = { top: 80, right: 60, bottom: 80, left: 20 };
  const chartWidth = width - margin.left - margin.right;
  
  xScale.range([0, chartWidth]);
  
  // Update positions of all elements based on new width
  guessGroup.selectAll('.grid line')
    .attr('x1', d => xScale(d))
    .attr('x2', d => xScale(d));
  
  guessGroup.select('.track-bar')
    .attr('width', chartWidth);
  
  if (currentGameIndex < guessData.length) {
    const game = guessData[currentGameIndex];
    guessGroup.select('#guess-bar')
      .attr('width', xScale(game.guess));
    
    guessGroup.select('#guess-label')
      .attr('x', xScale(game.guess));
    
    if (game.revealed) {
      guessGroup.select('#actual-bar')
        .attr('width', xScale(game.adjustedPrice));
      
      guessGroup.select('#actual-label')
        .attr('x', xScale(game.adjustedPrice));
    }
  }
}

// ============================================================================
// COMPARISON CHART - Pokemon vs Everyday Items Line Chart
// ============================================================================

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

// ============================================================================
// CONSOLE CHART - Console vs Game Price Chart
// ============================================================================

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

