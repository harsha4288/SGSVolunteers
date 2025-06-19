"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Star, Award, Zap, Globe } from 'lucide-react';

const solutions = [
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
    performance: "Excellent"
  },
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
    performance: "Excellent"
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
    performance: "Good"
  },
  {
    id: 1,
    title: "CSS Grid Approach",
    score: 97,
    rank: 10,
    status: "✅ Available",
    description: "Replace table with CSS Grid for flexible column sizing and frozen columns",
    highlights: ["Modern layout", "Clean approach", "Good performance"],
    icon: <Star className="h-5 w-5" />,
    difficulty: "Medium",
    performance: "High"
  },
  {
    id: 3,
    title: "Flexbox Hybrid",
    score: 105,
    rank: 6,
    status: "Available", 
    description: "Virtual table structure with flexbox for superior width control",
    highlights: ["Perfect control", "Mobile-first", "Fluid responsive"],
    icon: <Star className="h-5 w-5" />,
    difficulty: "Medium",
    performance: "High"
  },
  {
    id: 9,
    title: "ResizeObserver Dynamic",
    score: 99,
    rank: 9,
    status: "Available",
    description: "Real-time dynamic sizing with ResizeObserver API monitoring",
    highlights: ["Real-time adaptation", "Precise control", "Smooth animations"],
    icon: <Star className="h-5 w-5" />,
    difficulty: "Medium-High", 
    performance: "Medium"
  }
];

export default function TestSolutionsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">DataTable Solutions Testing Lab</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Test and compare 10 different approaches to fix the volunteer column width issue
        </p>
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant="outline" className="text-sm">
            🎯 Target: Volunteer column ≤ 25% width
          </Badge>
          <Badge variant="outline" className="text-sm">
            ✨ Zero text truncation
          </Badge>
          <Badge variant="outline" className="text-sm">
            📱 Perfect responsive design
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
              <CardDescription className="font-medium">
                {solution.title}
              </CardDescription>
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
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span>Complexity:</span>
                  <Badge variant="outline" className="text-xs">{solution.difficulty}</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Performance:</span>
                  <Badge variant="outline" className="text-xs">{solution.performance}</Badge>
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
                {(solution.id === 6 || solution.id === 1) ? (
                  <Link href={`/test-solutions/${solution.id}/assignments`}>
                    <Button className="w-full text-xs" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Test Assignments Table
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full text-xs" size="sm" variant="outline" disabled>
                    Coming Soon
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {(solution.id === 6 || solution.id === 1) ? (
                    <>
                      <Link href={`/test-solutions/${solution.id}/tshirts`}>
                        <Button variant="outline" className="w-full text-xs" size="sm">
                          T-shirts
                        </Button>
                      </Link>
                      <Link href={`/test-solutions/${solution.id}/requirements`}>
                        <Button variant="outline" className="w-full text-xs" size="sm">
                          Requirements
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full text-xs" size="sm" disabled>
                        T-shirts
                      </Button>
                      <Button variant="outline" className="w-full text-xs" size="sm" disabled>
                        Requirements
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Compare Solutions</h2>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/test-solutions/comparison">
            <Button variant="outline">
              📊 Side-by-Side Comparison
            </Button>
          </Link>
          <Link href="/test-solutions/validation-report">
            <Button variant="outline">
              📋 Full Validation Report
            </Button>
          </Link>
          <Link href="/app/assignments">
            <Button variant="outline">
              🔙 Back to Original
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}