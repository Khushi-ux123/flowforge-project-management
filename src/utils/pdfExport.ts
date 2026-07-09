import { jsPDF } from "jspdf";
import { User, Project, Task, UserRole, TaskStatus, TaskPriority } from "../types.ts";

/**
 * PDF Export Utility for FlowForge
 * Generates highly formatted, stakeholder-ready PDF reports tailored specifically
 * to the requesting user's authorization role.
 */

class PDFReportGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 297; // A4 dimensions in mm
  private pageWidth: number = 210;
  private margin: number = 15;
  private pageCount: number = 1;
  private accentColor: { r: number; g: number; b: number } = { r: 30, g: 58, b: 138 }; // Default Deep Corporate Blue

  constructor(role: UserRole) {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Configure role-based accent themes
    if (role === UserRole.OWNER || role === UserRole.MANAGER) {
      this.accentColor = { r: 30, g: 58, b: 138 }; // Deep Blue for executives/owners
    } else if (role === UserRole.MEMBER) {
      this.accentColor = { r: 51, g: 65, b: 85 }; // Slate Gray for developers/builders
    } else if (role === UserRole.CLIENT) {
      this.accentColor = { r: 15, g: 118, b: 110 }; // Emerald Teal for business clients
    }
  }

  // Draw standardized running page header
  private drawPageHeader(projectName: string) {
    this.doc.setFont("Helvetica", "normal");
    this.doc.setFontSize(8);
    this.doc.setTextColor(140, 140, 140);
    this.doc.text("FLOWFORGE STAKEHOLDER SYSTEMS REPORT", this.margin, 10);
    this.doc.text(
      `Project: ${projectName.toUpperCase()}`,
      this.pageWidth / 2,
      10,
      { align: "center" }
    );
    this.doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      this.pageWidth - this.margin,
      10,
      { align: "right" }
    );
    
    // Header divider line
    this.doc.setDrawColor(220, 225, 230);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, 12, this.pageWidth - this.margin, 12);
  }

  // Draw standardized running page footer
  private drawPageFooter() {
    this.doc.setFont("Helvetica", "italic");
    this.doc.setFontSize(8);
    this.doc.setTextColor(170, 175, 180);
    this.doc.text(
      "CONFIDENTIAL - Distributed only to authenticated workspace stakeholders. Powered by FlowForge.",
      this.margin,
      this.pageHeight - 10
    );
    this.doc.text(
      `Page ${this.pageCount}`,
      this.pageWidth - this.margin,
      this.pageHeight - 10,
      { align: "right" }
    );
  }

  // Ensures there is enough space on the current page for an element, else spawns a new one
  public ensureSpace(neededHeight: number, projectName: string) {
    if (this.currentY + neededHeight > this.pageHeight - 15) {
      this.drawPageFooter();
      this.doc.addPage();
      this.pageCount++;
      this.currentY = 22; // Start lower to clear the header
      this.drawPageHeader(projectName);
    }
  }

  /**
   * Generates a beautifully styled title card with custom colored side marker
   */
  public drawTitleCard(title: string, subtitle: string, reporterName: string, role: string, projectName: string) {
    this.drawPageHeader(projectName);
    this.currentY = 18;

    // Outer card rectangle (very light slate/gray)
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 32, "F");

    // Left accent highlight band
    this.doc.setFillColor(this.accentColor.r, this.accentColor.g, this.accentColor.b);
    this.doc.rect(this.margin, this.currentY, 3, 32, "F");

    // Primary Title
    this.doc.setFont("Helvetica", "bold");
    this.doc.setFontSize(14);
    this.doc.setTextColor(15, 23, 42); // slate-900
    this.doc.text(title, this.margin + 8, this.currentY + 10);

    // Subtitle / Scope
    this.doc.setFont("Helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 116, 139); // slate-500
    this.doc.text(subtitle, this.margin + 8, this.currentY + 16);

    // Audit Info
    this.doc.setFont("Helvetica", "bold");
    this.doc.setFontSize(8);
    this.doc.setTextColor(71, 85, 105); // slate-600
    this.doc.text(`Requester: ${reporterName}`, this.margin + 8, this.currentY + 25);
    
    this.doc.setFont("Helvetica", "normal");
    this.doc.text(`Role Target: ${role}`, this.pageWidth - this.margin - 8, this.currentY + 25, { align: "right" });

    this.currentY += 38;
  }

  /**
   * Generates a section header banner
   */
  public drawSectionHeader(title: string, projectName: string) {
    this.ensureSpace(12, projectName);
    
    // Sub-banner background
    this.doc.setFillColor(241, 245, 249);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 7, "F");

    // Left Accent vertical block
    this.doc.setFillColor(this.accentColor.r, this.accentColor.g, this.accentColor.b);
    this.doc.rect(this.margin, this.currentY, 1.5, 7, "F");

    // Label
    this.doc.setFont("Helvetica", "bold");
    this.doc.setFontSize(9);
    this.doc.setTextColor(this.accentColor.r, this.accentColor.g, this.accentColor.b);
    this.doc.text(title.toUpperCase(), this.margin + 5, this.currentY + 5);

    this.currentY += 12;
  }

  /**
   * Draws dynamic visual progress bar
   */
  public drawProgressBar(percentage: number, label: string, projectName: string) {
    this.ensureSpace(18, projectName);

    this.doc.setFont("Helvetica", "bold");
    this.doc.setFontSize(9);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(label, this.margin, this.currentY);
    this.doc.text(`${Math.round(percentage)}%`, this.pageWidth - this.margin, this.currentY, { align: "right" });

    this.currentY += 3;

    // Track Background
    this.doc.setFillColor(226, 232, 240);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 4, 1.5, 1.5, "F");

    // Active fill
    if (percentage > 0) {
      const activeWidth = (this.pageWidth - (this.margin * 2)) * (percentage / 100);
      this.doc.setFillColor(this.accentColor.r, this.accentColor.g, this.accentColor.b);
      this.doc.roundedRect(this.margin, this.currentY, activeWidth, 4, 1.5, 1.5, "F");
    }

    this.currentY += 10;
  }

  /**
   * Draws key value grid cards (Bento Style)
   */
  public drawBentoMetrics(metrics: { label: string; value: string; extra?: string }[], projectName: string) {
    const colCount = metrics.length === 4 ? 4 : metrics.length === 3 ? 3 : 2;
    this.ensureSpace(24, projectName);

    const totalWidth = this.pageWidth - (this.margin * 2);
    const colWidth = totalWidth / colCount;

    metrics.forEach((m, idx) => {
      const xPos = this.margin + (idx * colWidth);
      
      // Card Box Border
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setFillColor(255, 255, 255);
      this.doc.roundedRect(xPos, this.currentY, colWidth - 2, 18, 1, 1, "FD");

      // Label
      this.doc.setFont("Helvetica", "normal");
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(m.label.toUpperCase(), xPos + 2.5, this.currentY + 4.5);

      // Value text
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(11);
      this.doc.setTextColor(15, 23, 42);
      this.doc.text(m.value, xPos + 2.5, this.currentY + 10.5);

      // Small secondary caption/sparktext if any
      if (m.extra) {
        this.doc.setFont("Helvetica", "italic");
        this.doc.setFontSize(6.5);
        this.doc.setTextColor(148, 163, 184);
        this.doc.text(m.extra, xPos + 2.5, this.currentY + 15);
      }
    });

    this.currentY += 24;
  }

  /**
   * Standardized Table Drawing
   */
  public drawGridTable(
    headers: string[],
    rows: string[][],
    colWidths: number[],
    projectName: string
  ) {
    const rowHeight = 6.5;
    const headerHeight = 7;

    // Header first
    this.ensureSpace(headerHeight + rowHeight, projectName);

    // Draw header background
    this.doc.setFillColor(this.accentColor.r, this.accentColor.g, this.accentColor.b);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), headerHeight, "F");

    let currentX = this.margin;
    this.doc.setFont("Helvetica", "bold");
    this.doc.setFontSize(8);
    this.doc.setTextColor(255, 255, 255);

    headers.forEach((h, idx) => {
      this.doc.text(h, currentX + 2, this.currentY + 4.5);
      currentX += colWidths[idx];
    });

    this.currentY += headerHeight;

    // Draw rows
    rows.forEach((row, rowIdx) => {
      this.ensureSpace(rowHeight, projectName);

      // Alternating row background color
      if (rowIdx % 2 === 0) {
        this.doc.setFillColor(248, 250, 252);
      } else {
        this.doc.setFillColor(255, 255, 255);
      }
      this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), rowHeight, "F");

      // Draw bottom row border
      this.doc.setDrawColor(241, 245, 249);
      this.doc.setLineWidth(0.2);
      this.doc.line(this.margin, this.currentY + rowHeight, this.pageWidth - this.margin, this.currentY + rowHeight);

      let innerX = this.margin;
      this.doc.setFont("Helvetica", "normal");
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(51, 65, 85);

      row.forEach((cell, cellIdx) => {
        // Simple text truncating helper to fit table cell
        let displayCell = cell || "";
        const maxChar = Math.floor(colWidths[cellIdx] * 1.5);
        if (displayCell.length > maxChar) {
          displayCell = displayCell.substring(0, maxChar - 3) + "...";
        }
        this.doc.text(displayCell, innerX + 2, this.currentY + 4.5);
        innerX += colWidths[cellIdx];
      });

      this.currentY += rowHeight;
    });

    this.currentY += 4; // Add spacer below table
  }

  /**
   * Finalizes document download
   */
  public download(filename: string) {
    this.drawPageFooter();
    this.doc.save(filename);
  }
}

/**
 * Builds and downloads a completely tailored PDF report of the active project
 * based on the requesting user's security role.
 */
export function exportActiveProjectReport(
  project: Project,
  currentUser: User,
  tasksList: Task[],
  allUsers: User[]
) {
  const role = currentUser.role || UserRole.MEMBER;
  const generator = new PDFReportGenerator(role);
  const userMap = new Map(allUsers.map((u) => [u.id, u.fullName]));

  // 1. Gather stats
  const projectTasks = tasksList.filter((t) => t.projectId === project.id);
  const completedCount = projectTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const reviewCount = projectTasks.filter((t) => t.status === TaskStatus.REVIEW).length;
  const testingCount = projectTasks.filter((t) => t.status === TaskStatus.TESTING).length;
  const inProgressCount = projectTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
  const todoCount = projectTasks.filter((t) => t.status === TaskStatus.TODO).length;
  const backlogCount = projectTasks.filter((t) => t.status === TaskStatus.BACKLOG).length;
  
  const totalTasks = projectTasks.length;
  const completionPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Render report based on role:
  if (role === UserRole.OWNER || role === UserRole.MANAGER) {
    // ==========================================
    // OWNER / MANAGER: EXECUTIVE PORTFOLIO REPORT
    // ==========================================
    generator.drawTitleCard(
      "EXECUTIVE PORTFOLIO & AUDIT LEDGER",
      `FlowForge Project Review • Scope: ${project.name}`,
      currentUser.fullName,
      "Manager/Owner (Comprehensive)",
      project.name
    );

    // Section: Financial Performance & Status Summary
    generator.drawSectionHeader("Financial & Delivery Summary", project.name);
    
    // Bento Metrics for owner/PM
    const remainingBudget = project.budget - project.spent;
    const spentPercent = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
    
    generator.drawBentoMetrics([
      { label: "Total Budget Allocation", value: `$${project.budget.toLocaleString()}`, extra: "Base capital tier" },
      { label: "Committed Expenditures", value: `$${project.spent.toLocaleString()}`, extra: `${spentPercent}% budget consumed` },
      { label: "Surplus Workspace Reserve", value: `$${remainingBudget.toLocaleString()}`, extra: "Uncommitted balance" },
      { label: "Sprint Delivery Health", value: `${completedCount}/${totalTasks} Tasks`, extra: `${Math.round(completionPercentage)}% complete` }
    ], project.name);

    generator.drawProgressBar(completionPercentage, "Global Project Completion Status Index", project.name);

    // Section: Kanban Column Distribution
    generator.drawSectionHeader("Kanban & Sprint Velocity Status", project.name);
    generator.drawBentoMetrics([
      { label: "Completed Items", value: `${completedCount}`, extra: "Deployed to production" },
      { label: "Review & testing", value: `${reviewCount + testingCount}`, extra: "Quality gates active" },
      { label: "Active In Progress", value: `${inProgressCount}`, extra: "Actively being coded" },
      { label: "Planned Backlog / Todo", value: `${todoCount + backlogCount}`, extra: "Sprint pipeline queue" }
    ], project.name);

    // Section: Master Tickets Ledger Table
    generator.drawSectionHeader("Master Action Item & Ticket Ledger", project.name);
    
    // Headers & values for all tasks
    const headers = ["Ticket ID", "Task Title", "Assignee", "Priority", "Status", "Target Due"];
    // 180 total width space to distribute (margin leaves 180mm printable width on A4 210mm)
    const colWidths = [20, 55, 35, 20, 28, 22]; 

    const rows = projectTasks.map((t) => {
      const assigneeName = t.assigneeId ? (userMap.get(t.assigneeId) || "Unassigned") : "Unassigned";
      return [
        t.id.substring(0, 7).toUpperCase(),
        t.title,
        assigneeName,
        t.priority,
        t.status.replace("_", " "),
        t.dueDate || "N/A"
      ];
    });

    if (rows.length > 0) {
      generator.drawGridTable(headers, rows, colWidths, project.name);
    } else {
      generator.ensureSpace(12, project.name);
      generator.drawSectionHeader("No active tickets found in this project workspace.", project.name);
    }

  } else if (role === UserRole.MEMBER) {
    // ==========================================
    // TEAM MEMBER: BUILDER WORKLOAD REPORT
    // ==========================================
    generator.drawTitleCard(
      "TEAM SPRINT WORKLOAD & ALLOCATION",
      `FlowForge Technical Task Tracker • Project: ${project.name}`,
      currentUser.fullName,
      "Team Member / Developer Focus",
      project.name
    );

    generator.drawSectionHeader("Developer Core Metrics", project.name);

    // Calculate personal stats
    const myTasks = projectTasks.filter((t) => t.assigneeId === currentUser.id);
    const myCompleted = myTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const myPending = myTasks.length - myCompleted;
    const myCompletionRate = myTasks.length > 0 ? (myCompleted / myTasks.length) * 100 : 100;

    generator.drawBentoMetrics([
      { label: "My Allocated Tickets", value: `${myTasks.length} Assigned`, extra: "Your sprint commitment" },
      { label: "Pending Coded Deliverables", value: `${myPending} Tickets`, extra: "Active checklist" },
      { label: "Personal Completion Rate", value: `${Math.round(myCompletionRate)}%`, extra: "SLA delivery score" },
      { label: "Total Team Tickets", value: `${totalTasks} Active`, extra: "Shared sprint workload" }
    ], project.name);

    generator.drawProgressBar(myCompletionRate, "Your Sprint Backlog Completion Index", project.name);

    // Section: Personal Worklist Ledger
    generator.drawSectionHeader("Your Primary Assignment Checklist", project.name);
    
    const headers = ["Ticket ID", "Task Title", "Priority", "Status", "Target Due Date"];
    const colWidths = [25, 75, 25, 30, 25];

    const myRows = myTasks.map((t) => [
      t.id.substring(0, 7).toUpperCase(),
      t.title,
      t.priority,
      t.status.replace("_", " "),
      t.dueDate || "No deadline"
    ]);

    if (myRows.length > 0) {
      generator.drawGridTable(headers, myRows, colWidths, project.name);
    } else {
      generator.drawSectionHeader("No custom assignments active under your name in this workspace.", project.name);
    }

    // Section: Shared Co-developer assignments overview
    const peerTasks = projectTasks.filter((t) => t.assigneeId !== currentUser.id);
    if (peerTasks.length > 0) {
      generator.drawSectionHeader("Collaborative Team Progress Ledger", project.name);
      
      const peerHeaders = ["Ticket ID", "Task Title", "Assignee Partner", "Status"];
      const peerColWidths = [30, 80, 45, 25];
      
      const peerRows = peerTasks.slice(0, 15).map((t) => {
        const peerName = t.assigneeId ? (userMap.get(t.assigneeId) || "Unassigned") : "Unassigned";
        return [
          t.id.substring(0, 7).toUpperCase(),
          t.title,
          peerName,
          t.status.replace("_", " ")
        ];
      });

      generator.drawGridTable(peerHeaders, peerRows, peerColWidths, project.name);
    }

  } else {
    // ==========================================
    // CLIENT READ-ONLY: CLIENT DELIVERABLES REPORT
    // ==========================================
    generator.drawTitleCard(
      "CLIENT PROGRESS & DELIVERABLES SUMMARY",
      `FlowForge High-Level Project Health Summary • Scope: ${project.name}`,
      currentUser.fullName,
      "External Stakeholder (Read-Only)",
      project.name
    );

    generator.drawSectionHeader("Executive Scope & Progression Health", project.name);

    const activeOverlapCount = projectTasks.filter((t) => t.priority === TaskPriority.HIGH && t.status !== TaskStatus.COMPLETED).length;

    generator.drawBentoMetrics([
      { label: "Overall Progress Status", value: `${Math.round(completionPercentage)}% Complete`, extra: "Weighted deliverables index" },
      { label: "Completed Milestones", value: `${completedCount} items`, extra: "Shipped & verified safe" },
      { label: "Ongoing Review Focus", value: `${reviewCount} under review`, extra: "Client approval pipeline" },
      { label: "High-Priority Actionables", value: `${activeOverlapCount} remaining`, extra: "Primary focus attention" }
    ], project.name);

    generator.drawProgressBar(completionPercentage, "Aggregated Milestone Delivery Progress", project.name);

    // Section: Milestones completed
    generator.drawSectionHeader("Successfully Shipped Deliverables", project.name);
    
    const clientHeaders = ["Milestone Title", "Target Priority", "Fulfillment Status", "Target Due Date"];
    const clientColWidths = [85, 30, 35, 30];

    const completedTasks = projectTasks.filter((t) => t.status === TaskStatus.COMPLETED);
    const completedRows = completedTasks.slice(0, 12).map((t) => [
      t.title,
      t.priority,
      "FULFILLED / VERIFIED",
      t.dueDate || "Completed"
    ]);

    if (completedRows.length > 0) {
      generator.drawGridTable(clientHeaders, completedRows, clientColWidths, project.name);
    } else {
      generator.drawSectionHeader("No completed deliverables flagged yet. Setup upcoming milestone tracks.", project.name);
    }

    // Section: Roadmap Focus next up
    const futureFocus = projectTasks.filter((t) => t.status !== TaskStatus.COMPLETED && t.priority === TaskPriority.HIGH);
    if (futureFocus.length > 0) {
      generator.drawSectionHeader("Upcoming Strategic Focus & Milestones", project.name);
      
      const futureHeaders = ["High-Priority Target", "Planned Stage", "Assignee Lead", "Committed Target Date"];
      const futureColWidths = [80, 35, 35, 30];
      
      const futureRows = futureFocus.slice(0, 8).map((t) => {
        const leadName = t.assigneeId ? (userMap.get(t.assigneeId) || "Team Specialist") : "Team Specialist";
        return [
          t.title,
          t.status.replace("_", " "),
          leadName,
          t.dueDate || "Sprint target"
        ];
      });

      generator.drawGridTable(futureHeaders, futureRows, futureColWidths, project.name);
    }
  }

  // Final download output trigger
  const fileSafeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  generator.download(`flowforge-report-${fileSafeName}.pdf`);
}
