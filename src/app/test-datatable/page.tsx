'use client';

import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Grid, Monitor, Smartphone, Tablet } from 'lucide-react';

// Dynamic imports for working solutions only
const DynamicIntegrationDemo = React.lazy(() => 
  import('../../../datatable_solutions/solution_3_dynamic/integration-demo').then(module => ({
    default: module.DynamicIntegrationDemo
  }))
);

const RevolutionaryIntegrationDemo = React.lazy(() => 
  import('../../../datatable_solutions/solution_4_revolutionary/integration-demo').then(module => ({
    default: module.RevolutionaryIntegrationDemo
  }))
);

const EnhancedContextualIntegrationDemo = React.lazy(() => 
  import('../../../datatable_solutions/solution_7_1_enhanced/integration-demo').then(module => ({
    default: module.ContextualIntegrationDemo
  }))
);

const EnhancedSolutionDemo = React.lazy(() => 
  import('../../../datatable_solutions/solution_3_enhanced/integration-demo').then(module => ({
    default: module.EnhancedIntegrationDemo
  }))
);

interface Solution {
  id: string;
  name: string;
  description: string;
  approach: string;
  keyFeatures: string[];
  complexity: 'Simple' | 'Moderate' | 'Advanced' | 'Complex';
  status: 'Working' | 'Fixed' | 'New';
  component: React.ComponentType;
}

const solutions: Solution[] = [
  {
    id: 'solution_3',
    name: 'Dynamic CSS Variables Integration', 
    description: 'Real-time CSS variable manipulation based on content measurement and viewport with frozen columns support.',
    approach: 'Dynamic CSS custom properties with content analysis and frozen columns',
    keyFeatures: ['CSS custom properties', 'Content measurement', 'Real-time adaptation', 'Frozen columns support'],
    complexity: 'Moderate',
    status: 'Working',
    component: DynamicIntegrationDemo
  },
  {
    id: 'solution_3_enhanced',
    name: 'Enhanced Dynamic with Reusable Cells',
    description: 'Solution 3 enhanced with reusable cell components for zero breaking changes and full backward compatibility.',
    approach: 'Reusable cell components with unified patterns across all modules',
    keyFeatures: ['Reusable cells', 'Zero breaking changes', 'Unified UX patterns', '60% code reduction'],
    complexity: 'Simple',
    status: 'New',
    component: EnhancedSolutionDemo
  },
  {
    id: 'solution_4',
    name: 'Revolutionary Responsive Layout',
    description: 'Completely abandons table paradigm on mobile/tablet with intelligent layout transformation and frozen columns.',
    approach: 'Multi-layout rendering system with context-aware presentation and frozen columns',
    keyFeatures: ['Timeline layout', 'Card-based grid', 'Layout transformation', 'Progressive disclosure', 'Frozen columns'],
    complexity: 'Advanced',
    status: 'Fixed',
    component: RevolutionaryIntegrationDemo
  },
  {
    id: 'solution_7_1',
    name: 'Enhanced Context-Aware Responsive',
    description: 'Enhanced version with proper frozen columns and intelligent overflow handling that prevents content cutting.',
    approach: 'Enhanced content analysis with frozen columns and content protection',
    keyFeatures: ['Enhanced frozen columns', 'Content cutting prevention', 'Table-level scrolling', 'Min column widths', 'Expandable rows'],
    complexity: 'Advanced', 
    status: 'New',
    component: EnhancedContextualIntegrationDemo
  }
];

export default function TestDataTablePage() {
  const [currentSolution, setCurrentSolution] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSolutionChange = async (index: number) => {
    if (index === currentSolution) return;
    
    setIsLoading(true);
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300));
    setCurrentSolution(index);
    setIsLoading(false);
  };

  const nextSolution = () => {
    const next = (currentSolution + 1) % solutions.length;
    handleSolutionChange(next);
  };

  const prevSolution = () => {
    const prev = currentSolution === 0 ? solutions.length - 1 : currentSolution - 1;
    handleSolutionChange(prev);
  };

  const getCurrentComponent = () => {
    const CurrentComponent = solutions[currentSolution].component;
    return <CurrentComponent />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Working': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'Fixed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'New': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300';
      case 'Moderate': return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300';
      case 'Advanced': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300';
      case 'Complex': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">DataTable Solutions Navigator</h1>
        <p className="text-muted-foreground mb-6">
          Navigate through the 4 enhanced solutions to compare their approaches to solving the volunteer column width problem.
          Each solution demonstrates a different technique for responsive table design with frozen columns support.
        </p>
      </div>

      {/* Solution Navigator */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                Solution {currentSolution + 1} of {solutions.length}
                <Badge className={getStatusColor(solutions[currentSolution].status)}>
                  {solutions[currentSolution].status}
                </Badge>
                <Badge variant="outline" className={getComplexityColor(solutions[currentSolution].complexity)}>
                  {solutions[currentSolution].complexity}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2">
                {solutions[currentSolution].name}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevSolution}
                disabled={isLoading}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextSolution}
                disabled={isLoading}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {solutions[currentSolution].description}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Approach</h4>
              <p className="text-sm text-muted-foreground">
                {solutions[currentSolution].approach}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold mb-3">Key Features</h4>
            <div className="flex flex-wrap gap-2">
              {solutions[currentSolution].keyFeatures.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          {/* Solution Grid Navigation */}
          <div className="grid grid-cols-4 gap-2">
            {solutions.map((solution, index) => (
              <Button
                key={solution.id}
                variant={index === currentSolution ? "default" : "outline"}
                size="sm"
                onClick={() => handleSolutionChange(index)}
                disabled={isLoading}
                className="h-12 p-2 text-xs"
              >
                <div className="text-center">
                  <div className="font-semibold">{index + 1}</div>
                  <div className="text-xs opacity-75 truncate">
                    {solution.name.split(' ')[0]}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Responsive Testing Indicators */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-medium">Testing tip:</span>
          <div className="flex items-center gap-2">
            <Smartphone size={16} />
            <span>Resize window to test mobile behavior</span>
          </div>
          <div className="flex items-center gap-2">
            <Tablet size={16} />
            <span>Check tablet breakpoints</span>
          </div>
          <div className="flex items-center gap-2">
            <Monitor size={16} />
            <span>Verify desktop layout</span>
          </div>
        </div>
      </div>

      {/* Current Solution Demo */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Grid className="animate-spin" size={20} />
              <span>Loading solution...</span>
            </div>
          </div>
        )}
        
        <Suspense fallback={
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Grid className="animate-spin" size={20} />
              <span>Loading solution...</span>
            </div>
          </div>
        }>
          {getCurrentComponent()}
        </Suspense>
      </div>

      {/* Footer Navigation */}
      <div className="mt-8 flex items-center justify-between p-4 bg-muted/20 rounded-lg">
        <Button 
          variant="ghost" 
          onClick={prevSolution}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          {currentSolution > 0 ? solutions[currentSolution - 1].name : solutions[solutions.length - 1].name}
        </Button>
        
        <div className="text-sm text-muted-foreground">
          {currentSolution + 1} / {solutions.length}
        </div>
        
        <Button 
          variant="ghost" 
          onClick={nextSolution}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {currentSolution < solutions.length - 1 ? solutions[currentSolution + 1].name : solutions[0].name}
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}