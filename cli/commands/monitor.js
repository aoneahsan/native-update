import chalk from 'chalk';
import ora from 'ora';

export async function monitor(options) {
  if (!options.server) {
    console.error(chalk.red('Error: --server URL is required'));
    process.exit(1);
  }

  console.log(chalk.blue(`📊 Monitoring updates from ${options.server}...`));
  console.log(chalk.gray('Press Ctrl+C to stop'));
  console.log('');

  const spinner = ora('Fetching update statistics...').start();

  try {
    // Poll server for stats
    setInterval(async () => {
      try {
        const headers = options.key ? { 'Authorization': `Bearer ${options.key}` } : {};
        
        const response = await fetch(`${options.server}/api/stats`, { headers });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const stats = await response.json();
        
        spinner.stop();
        console.clear();
        console.log(chalk.blue(`📊 Update Monitor - ${new Date().toLocaleTimeString()}`));
        console.log(chalk.gray('─'.repeat(50)));
        console.log('');
        
        console.log(chalk.bold('Current Version:'));
        console.log(chalk.gray(`  Latest: ${stats.latestVersion || 'N/A'}`));
        console.log(chalk.gray(`  Channel: ${stats.channel || 'production'}`));
        console.log('');
        
        console.log(chalk.bold('Download Statistics:'));
        console.log(chalk.gray(`  Total Downloads: ${stats.totalDownloads || 0}`));
        console.log(chalk.gray(`  Downloads Today: ${stats.downloadsToday || 0}`));
        console.log(chalk.gray(`  Active Installs: ${stats.activeInstalls || 0}`));
        console.log('');
        
        if (stats.recentActivity) {
          console.log(chalk.bold('Recent Activity:'));
          stats.recentActivity.forEach(activity => {
            console.log(chalk.gray(`  ${activity.time} - ${activity.action} (${activity.version})`));
          });
        }
        
        console.log('');
        console.log(chalk.gray('Press Ctrl+C to stop'));
        
        spinner.start('Updating...');
      } catch (error) {
        spinner.fail(`Failed to fetch stats: ${error.message}`);
        spinner.start('Retrying...');
      }
    }, 5000); // Update every 5 seconds

  } catch (error) {
    spinner.fail(`Monitor failed: ${error.message}`);
    process.exit(1);
  }
}