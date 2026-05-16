'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/ui/app-shell';
import { DiscoveryDashboard } from '@/components/ui/discovery-dashboard';
import { ProjectReportModal } from '@/components/ui/project-report-modal';
import { ProjectIntelligence } from '@/components/ui/project-intelligence-card';
import { AlertTriangle } from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState<ProjectIntelligence[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data.projects);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <AppShell>
      <DiscoveryDashboard
        projects={projects}
        onProjectSelect={setSelectedProject}
        isLoading={isLoading}
      />
      <ProjectReportModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
      {error && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border chip-danger shadow-lg max-w-sm">
          <AlertTriangle size={14} />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </AppShell>
  );
}
