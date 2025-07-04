"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Award, Zap, Globe, Star } from 'lucide-react';

const solutions = [
  {
    id: 8,
    title: "Adaptive Breakpoint System", 
    score: 122,
    rank: 1,
    status: "🥇 Gold Medal",
    description: "Multi-layout system that switches strategies based on content and viewport",
    highlights: ["Content-aware switching", "Multiple strategies", "Ultimate flexibility"],
    icon: <Award className="h-5 w-5" />,
    difficulty: "High",
    performance: "Excellent",
    implemented: false
  },
  {
    id: 6,
    title: "CSS Intrinsic Sizing",
    score: 119,
    rank: 2,
    status: "🥈 Silver Medal",
    description: "Uses fit-content() and CSS intrinsic sizing for zero-overhead content-aware columns",
    highlights: ["Zero JavaScript", "Perfect browser support", "Content-aware sizing"],
    icon: <Zap className="h-5 w-5" />,
    difficulty: "Low-Medium",
    performance: "Excellent",
    implemented: true
  },
  {
    id: 2,
    title: "Dynamic Table Layout",
    score: 112, 
    rank: 3,
    status: "🥉 Bronze Medal",
    description: "Intelligent width detection with content analysis and responsive distribution",
    highlights: ["Table semantics", "Intelligent analysis", "Gradual enhancement"],
    icon: <Globe className="h-5 w-5" />,
    difficulty: "Medium-High",
    performance: "Good",
    implemented: false
  },
  {
    id: 1,
    title: "CSS Grid Approach",
    score: 97,
    rank: 10,
    status: "Available",
    description: "Replace table with CSS Grid for flexible column sizing and frozen columns",
    highlights: ["Modern layout", "Clean approach", "Good performance"],
    icon: <Star className="h-5 w-5" />,
    difficulty: "Medium",
    performance: "High",
    implemented: true
  },
];

export default function ComparisonPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/test-solutions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Solutions Lab
            </Button>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Solutions Comparison</h1>
        <p className="text-lg text-muted-foreground mb-4">
          Side-by-side comparison of the top 3 DataTable solutions
        </p>
      </div>

      {/* Comparison Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {solutions.map((solution) => (
          <Card key={solution.id} className={`relative ${solution.rank <= 3 ? 'ring-2 ring-primary/20' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {solution.icon}
                  <CardTitle className="text-lg">Solution {solution.id}</CardTitle>
                </div>
                <Badge variant={solution.rank <= 3 ? "default" : "secondary"}>
                  #{solution.rank}
                </Badge>
              </div>
              <div className="text-sm font-medium text-primary">
                {solution.title}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Score: {solution.score}/100
                </Badge>
                <Badge variant={solution.rank <= 3 ? "default" : "secondary"} className="text-xs">
                  {solution.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {solution.description}
              </p>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-xs">
                  <span>Complexity:</span>
                  <Badge variant="outline" className="text-xs">{solution.difficulty}</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Performance:</span>
                  <Badge variant="outline" className="text-xs">{solution.performance}</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Implementation:</span>
                  <Badge variant={solution.implemented ? "default" : "secondary"} className="text-xs">
                    {solution.implemented ? "✅ Available" : "⏳ Planned"}
                  </Badge>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium mb-2">Key Features:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {solution.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-primary rounded-full"></span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                {solution.implemented ? (
                  <Link href={`/test-solutions/${solution.id}/assignments`}>
                    <Button className="w-full text-xs" size="sm">
                      🧪 Test Live Demo
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full text-xs" size="sm" variant="outline" disabled>
                    Coming Soon
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scoring Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scoring Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Performance Metrics (40%)</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• JavaScript overhead</li>
                <li>• Rendering performance</li>
                <li>• Memory usage</li>
                <li>• Browser compatibility</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">User Experience (35%)</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Column width distribution</li>
                <li>• Responsive behavior</li>
                <li>• Text readability</li>
                <li>• Visual consistency</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Implementation Quality (25%)</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Code maintainability</li>
                <li>• Accessibility features</li>
                <li>• Error handling</li>
                <li>• Future extensibility</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Ready to Test?</h2>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/test-solutions/6/assignments">
            <Button variant="default">
              🥈 Test Solution 6 (CSS Intrinsic)
            </Button>
          </Link>
          <Link href="/test-solutions/1/assignments">
            <Button variant="outline">
              ⭐ Test Solution 1 (CSS Grid)
            </Button>
          </Link>
          <Link href="/test-solutions">
            <Button variant="outline">
              🔙 Back to Solutions Lab
            </Button>
          </Link>
          <Link href="/app/assignments">
            <Button variant="outline">
              📋 View Original Implementation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}