// Interactive Guessing Component for Pokemon Prices - Progressive Reveal

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
  
  if (guessedGames === 0) {
    message = `<strong>You skipped all the guesses!</strong> Let's show you what you missed...`;
  } else if (guessedGames === guessData.length) {
    const avgDiff = d3.mean(userGuesses, d => Math.abs(d.diff));
    const overestimated = userGuesses.filter(d => d.diff > 5).length;
    
    if (avgDiff < 5) {
      message = `<strong>🎯 Impressive!</strong> You guessed all ${guessedGames} games with an average error of only $${avgDiff.toFixed(2)}.`;
    } else if (overestimated > guessedGames / 2) {
      message = `You overestimated ${overestimated} out of ${guessedGames} games. <strong>Most people think games got more expensive than they actually did.</strong> Let's see why...`;
    } else {
      message = `You guessed ${guessedGames} games! <strong>Here's what the data actually shows...</strong>`;
    }
  } else {
    const avgDiff = d3.mean(userGuesses, d => Math.abs(d.diff));
    message = `You guessed ${guessedGames} out of ${guessData.length} games. Average error: $${avgDiff.toFixed(2)}. <strong>Here's the truth...</strong>`;
  }
  
  summary.html(message)
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
