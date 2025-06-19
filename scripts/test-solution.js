#!/usr/bin/env node

/**
 * Manual DataTable Solution Tester
 * Deploy and test individual solutions
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class ManualTester {
  constructor() {
    this.solutionsDir = './datatable_solutions';
    this.backupDir = './src_backup';
    this.currentSolution = null;
  }

  async start() {
    console.log('🎯 DataTable Solution Manual Tester\n');
    
    // Create backup first
    await this.createBackup();
    
    while (true) {
      await this.showMenu();
      const choice = await this.getUserInput('\nChoose an option (1-4): ');
      
      switch (choice) {
        case '1':
          await this.listSolutions();
          break;
        case '2':
          await this.deploySolution();
          break;
        case '3':
          await this.runCurrentSolution();
          break;
        case '4':
          await this.restoreOriginal();
          console.log('👋 Goodbye!');
          process.exit(0);
        default:
          console.log('❌ Invalid option. Please try again.\n');
      }
    }
  }

  async showMenu() {
    console.log('📋 Available Actions:');
    console.log('1. 📦 List all generated solutions');
    console.log('2. 🚀 Deploy a solution for testing');
    console.log('3. 🌐 Run current solution (starts dev server)');
    console.log('4. 🔄 Restore original and exit');
    
    if (this.currentSolution) {
      console.log(`\n📍 Currently deployed: Solution ${this.currentSolution}`);
    }
  }

  async listSolutions() {
    console.log('\n📦 Generated Solutions:\n');
    
    try {
      const solutions = await this.getSolutionDirectories();
      
      solutions.forEach((solutionPath, index) => {
        const solutionNumber = index + 1;
        console.log(`${solutionNumber}. ${path.basename(solutionPath)}`);
        
        // Try to show solution summary if available
        this.showSolutionSummary(solutionPath, solutionNumber);
      });
      
      if (solutions.length === 0) {
        console.log('❌ No solutions found. Run the infinite agentic loop first.');
      }
      
    } catch (error) {
      console.error('❌ Error listing solutions:', error.message);
    }
    
    console.log('');
  }

  async showSolutionSummary(solutionPath, solutionNumber) {
    try {
      const summaryPath = path.join(solutionPath, 'README.md');
      const summary = await fs.readFile(summaryPath, 'utf8');
      
      // Extract first line as title
      const firstLine = summary.split('\n')[0].replace(/^#\s*/, '');
      console.log(`   📝 ${firstLine}`);
      
    } catch (error) {
      console.log(`   📝 Solution ${solutionNumber} - DataTable Implementation`);
    }
  }

  async deploySolution() {
    const solutions = await this.getSolutionDirectories();
    
    if (solutions.length === 0) {
      console.log('❌ No solutions available to deploy.\n');
      return;
    }

    console.log('\n🚀 Deploy Solution\n');
    console.log('Available solutions:');
    
    solutions.forEach((_, index) => {
      console.log(`${index + 1}. Solution ${index + 1}`);
    });

    const choice = await this.getUserInput('\nWhich solution to deploy (number): ');
    const solutionIndex = parseInt(choice) - 1;

    if (solutionIndex < 0 || solutionIndex >= solutions.length) {
      console.log('❌ Invalid solution number.\n');
      return;
    }

    try {
      console.log(`\n📁 Deploying Solution ${solutionIndex + 1}...`);
      
      await this.deployFiles(solutions[solutionIndex]);
      this.currentSolution = solutionIndex + 1;
      
      console.log(`✅ Solution ${solutionIndex + 1} deployed successfully!`);
      console.log('💡 You can now run option 3 to start the dev server and test it.\n');
      
    } catch (error) {
      console.error('❌ Error deploying solution:', error.message);
    }
  }

  async runCurrentSolution() {
    if (!this.currentSolution) {
      console.log('❌ No solution currently deployed. Use option 2 first.\n');
      return;
    }

    console.log(`\n🌐 Starting dev server for Solution ${this.currentSolution}...`);
    console.log('📍 Test URLs:');
    console.log('   - Assignments: http://localhost:3000/app/assignments');
    console.log('   - T-shirts: http://localhost:3000/app/tshirts');
    console.log('   - Requirements: http://localhost:3000/app/requirements');
    console.log('\n⚠️  Press Ctrl+C to stop the server when done testing.\n');

    try {
      // Start the development server
      const child = exec('npm run dev', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error starting dev server:', error);
          return;
        }
      });

      child.stdout.on('data', (data) => {
        process.stdout.write(data);
      });

      child.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

      // Handle process termination
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping dev server...');
        child.kill();
        console.log('✅ Dev server stopped.\n');
      });

      // Wait for the child process to exit
      await new Promise((resolve) => {
        child.on('exit', resolve);
      });

    } catch (error) {
      console.error('❌ Error running solution:', error.message);
    }
  }

  async deployFiles(solutionPath) {
    // Look for implementation files
    const implementationDir = path.join(solutionPath, 'implementation');
    
    if (await this.directoryExists(implementationDir)) {
      console.log('  📁 Copying implementation files...');
      await this.copyDirectory(implementationDir, './src');
    } else {
      throw new Error('No implementation directory found in solution');
    }

    // Check for TypeScript compilation
    console.log('  🔧 Checking TypeScript compilation...');
    try {
      await this.execAsync('npx tsc --noEmit');
      console.log('  ✅ TypeScript compilation successful');
    } catch (error) {
      console.log('  ⚠️  TypeScript compilation has warnings/errors');
      console.log('     You may see issues when running the solution');
    }
  }

  async createBackup() {
    console.log('💾 Creating backup of original files...\n');
    
    const filesToBackup = [
      'src/components/ui/data-table.tsx',
      'src/app/app/assignments/components/assignments-table.tsx',
      'src/app/app/tshirts/components/unified-tshirt-table.tsx',
      'src/app/app/requirements/components/requirements-table.tsx'
    ];

    await fs.mkdir(this.backupDir, { recursive: true });

    for (const file of filesToBackup) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const backupPath = path.join(this.backupDir, path.basename(file));
        await fs.writeFile(backupPath, content);
      } catch (error) {
        console.warn(`⚠️  Could not backup ${file}:`, error.message);
      }
    }
  }

  async restoreOriginal() {
    console.log('\n🔄 Restoring original implementation...');
    
    try {
      const backupFiles = await fs.readdir(this.backupDir);
      
      for (const file of backupFiles) {
        const content = await fs.readFile(path.join(this.backupDir, file), 'utf8');
        
        // Map back to original locations
        let targetPath;
        if (file === 'data-table.tsx') {
          targetPath = 'src/components/ui/data-table.tsx';
        } else if (file === 'assignments-table.tsx') {
          targetPath = 'src/app/app/assignments/components/assignments-table.tsx';
        } else if (file === 'unified-tshirt-table.tsx') {
          targetPath = 'src/app/app/tshirts/components/unified-tshirt-table.tsx';
        } else if (file === 'requirements-table.tsx') {
          targetPath = 'src/app/app/requirements/components/requirements-table.tsx';
        }

        if (targetPath) {
          await fs.writeFile(targetPath, content);
        }
      }

      // Clean up backup
      await fs.rm(this.backupDir, { recursive: true, force: true });
      
      console.log('✅ Original implementation restored.');
      this.currentSolution = null;
      
    } catch (error) {
      console.error('❌ Error restoring original:', error.message);
    }
  }

  async getSolutionDirectories() {
    try {
      const entries = await fs.readdir(this.solutionsDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory() && entry.name.startsWith('iteration_'))
        .map(entry => path.join(this.solutionsDir, entry.name))
        .sort();
    } catch (error) {
      console.warn('Solutions directory not found, creating sample structure...');
      return [];
    }
  }

  async directoryExists(dir) {
    try {
      const stat = await fs.stat(dir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  async execAsync(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  getUserInput(prompt) {
    return new Promise((resolve) => {
      if (rl.closed) {
        // If readline is closed, create a new one
        const newRl = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        newRl.question(prompt, (answer) => {
          resolve(answer.trim());
        });
      } else {
        rl.question(prompt, (answer) => {
          resolve(answer.trim());
        });
      }
    });
  }
}

// Run the manual tester
if (require.main === module) {
  const tester = new ManualTester();
  tester.start().catch(console.error);
}

module.exports = ManualTester;