#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

// Define schemas for our tools
const RepoListSchema = z.object({
  owner: z.string().optional().describe("Repository owner (default: authenticated user)"),
  limit: z.number().optional().default(30).describe("Number of repositories to list"),
  type: z.enum(["all", "owner", "member"]).optional().default("all").describe("Repository type filter"),
});

const RepoInfoSchema = z.object({
  owner: z.string().describe("Repository owner"),
  repo: z.string().describe("Repository name"),
});

const IssueListSchema = z.object({
  owner: z.string().optional().describe("Repository owner"),
  repo: z.string().optional().describe("Repository name"),
  state: z.enum(["open", "closed", "all"]).optional().default("open").describe("Issue state"),
  limit: z.number().optional().default(30).describe("Number of issues to list"),
});

const IssueCreateSchema = z.object({
  owner: z.string().describe("Repository owner"),
  repo: z.string().describe("Repository name"),
  title: z.string().describe("Issue title"),
  body: z.string().optional().describe("Issue body/description"),
  labels: z.array(z.string()).optional().describe("Labels to add"),
  assignees: z.array(z.string()).optional().describe("Users to assign"),
});

const PRListSchema = z.object({
  owner: z.string().optional().describe("Repository owner"),
  repo: z.string().optional().describe("Repository name"),
  state: z.enum(["open", "closed", "merged", "all"]).optional().default("open").describe("PR state"),
  limit: z.number().optional().default(30).describe("Number of PRs to list"),
});

const PRCreateSchema = z.object({
  owner: z.string().describe("Repository owner"),
  repo: z.string().describe("Repository name"),
  title: z.string().describe("Pull request title"),
  body: z.string().optional().describe("Pull request body/description"),
  head: z.string().describe("Branch to merge from"),
  base: z.string().describe("Branch to merge into"),
  draft: z.boolean().optional().default(false).describe("Create as draft PR"),
});

const RepoCreateSchema = z.object({
  name: z.string().describe("Repository name"),
  description: z.string().optional().describe("Repository description"),
  private: z.boolean().optional().default(false).describe("Create as private repository"),
  org: z.string().optional().describe("Organization to create repo in"),
});

const WorkflowListSchema = z.object({
  owner: z.string().describe("Repository owner"),
  repo: z.string().describe("Repository name"),
});

const WorkflowRunSchema = z.object({
  owner: z.string().describe("Repository owner"),
  repo: z.string().describe("Repository name"),
  workflow: z.string().describe("Workflow ID or filename"),
  ref: z.string().optional().default("main").describe("Git reference to run workflow on"),
});

class GitHubMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server({
      name: "gh-mcp-server",
      version: "1.0.0",
    });

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "gh_repo_list",
          description: "List repositories",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner (default: authenticated user)" },
              limit: { type: "number", description: "Number of repositories to list", default: 30 },
              type: { type: "string", enum: ["all", "owner", "member"], description: "Repository type filter", default: "all" },
            },
          },
        },
        {
          name: "gh_repo_info",
          description: "Get detailed repository information",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner" },
              repo: { type: "string", description: "Repository name" },
            },
            required: ["owner", "repo"],
          },
        },
        {
          name: "gh_repo_create",
          description: "Create a new repository",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Repository name" },
              description: { type: "string", description: "Repository description" },
              private: { type: "boolean", description: "Create as private repository", default: false },
              org: { type: "string", description: "Organization to create repo in" },
            },
            required: ["name"],
          },
        },
        {
          name: "gh_issue_list",
          description: "List issues",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner" },
              repo: { type: "string", description: "Repository name" },
              state: { type: "string", enum: ["open", "closed", "all"], description: "Issue state", default: "open" },
              limit: { type: "number", description: "Number of issues to list", default: 30 },
            },
          },
        },
        {
          name: "gh_issue_create",
          description: "Create a new issue",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner" },
              repo: { type: "string", description: "Repository name" },
              title: { type: "string", description: "Issue title" },
              body: { type: "string", description: "Issue body/description" },
              labels: { type: "array", items: { type: "string" }, description: "Labels to add" },
              assignees: { type: "array", items: { type: "string" }, description: "Users to assign" },
            },
            required: ["owner", "repo", "title"],
          },
        },
        {
          name: "gh_pr_list",
          description: "List pull requests",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner" },
              repo: { type: "string", description: "Repository name" },
              state: { type: "string", enum: ["open", "closed", "merged", "all"], description: "PR state", default: "open" },
              limit: { type: "number", description: "Number of PRs to list", default: 30 },
            },
          },
        },
        {
          name: "gh_pr_create",
          description: "Create a new pull request",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner" },
              repo: { type: "string", description: "Repository name" },
              title: { type: "string", description: "Pull request title" },
              body: { type: "string", description: "Pull request body/description" },
              head: { type: "string", description: "Branch to merge from" },
              base: { type: "string", description: "Branch to merge into" },
              draft: { type: "boolean", description: "Create as draft PR", default: false },
            },
            required: ["owner", "repo", "title", "head", "base"],
          },
        },
        {
          name: "gh_workflow_list",
          description: "List GitHub Actions workflows",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner" },
              repo: { type: "string", description: "Repository name" },
            },
            required: ["owner", "repo"],
          },
        },
        {
          name: "gh_workflow_run",
          description: "Trigger a GitHub Actions workflow",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner" },
              repo: { type: "string", description: "Repository name" },
              workflow: { type: "string", description: "Workflow ID or filename" },
              ref: { type: "string", description: "Git reference to run workflow on", default: "main" },
            },
            required: ["owner", "repo", "workflow"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "gh_repo_list":
            return await this.handleRepoList(args);
          case "gh_repo_info":
            return await this.handleRepoInfo(args);
          case "gh_repo_create":
            return await this.handleRepoCreate(args);
          case "gh_issue_list":
            return await this.handleIssueList(args);
          case "gh_issue_create":
            return await this.handleIssueCreate(args);
          case "gh_pr_list":
            return await this.handlePRList(args);
          case "gh_pr_create":
            return await this.handlePRCreate(args);
          case "gh_workflow_list":
            return await this.handleWorkflowList(args);
          case "gh_workflow_run":
            return await this.handleWorkflowRun(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
      }
    });
  }

  private async handleRepoList(args: any) {
    const parsed = RepoListSchema.parse(args);
    let command = `gh repo list`;
    
    if (parsed.owner) {
      command += ` ${parsed.owner}`;
    }
    
    command += ` --limit ${parsed.limit} --json name,description,isPrivate,url,updatedAt,stargazerCount`;
    
    if (parsed.type !== "all") {
      command += ` --${parsed.type}`;
    }

    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && stderr.trim()) {
      throw new McpError(ErrorCode.InternalError, `GitHub CLI error: ${stderr}`);
    }

    return {
      content: [{ type: "text", text: `Repositories:\n${stdout}` }],
    };
  }

  private async handleRepoInfo(args: any) {
    const parsed = RepoInfoSchema.parse(args);
    const command = `gh repo view ${parsed.owner}/${parsed.repo} --json name,description,isPrivate,url,stargazerCount,forkCount,primaryLanguage,repositoryTopics,createdAt,updatedAt,pushedAt`;

    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && stderr.trim()) {
      throw new McpError(ErrorCode.InternalError, `GitHub CLI error: ${stderr}`);
    }

    return {
      content: [{ type: "text", text: `Repository Info:\n${stdout}` }],
    };
  }

  private async handleRepoCreate(args: any) {
    const parsed = RepoCreateSchema.parse(args);
    let command = `gh repo create ${parsed.name}`;
    
    if (parsed.description) {
      command += ` --description "${parsed.description}"`;
    }
    
    if (parsed.private) {
      command += " --private";
    } else {
      command += " --public";
    }
    
    if (parsed.org) {
      command = `gh repo create ${parsed.org}/${parsed.name}`;
      if (parsed.description) {
        command += ` --description "${parsed.description}"`;
      }
      if (parsed.private) {
        command += " --private";
      } else {
        command += " --public";
      }
    }

    const { stdout, stderr } = await execAsync(command);
    
    return {
      content: [{ type: "text", text: `Repository Created:\n${stdout}\n${stderr ? `Warnings:\n${stderr}` : ""}` }],
    };
  }

  private async handleIssueList(args: any) {
    const parsed = IssueListSchema.parse(args);
    let command = `gh issue list`;
    
    if (parsed.owner && parsed.repo) {
      command += ` --repo ${parsed.owner}/${parsed.repo}`;
    }
    
    command += ` --state ${parsed.state} --limit ${parsed.limit} --json number,title,state,author,createdAt,updatedAt,labels`;

    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && stderr.trim()) {
      throw new McpError(ErrorCode.InternalError, `GitHub CLI error: ${stderr}`);
    }

    return {
      content: [{ type: "text", text: `Issues:\n${stdout}` }],
    };
  }

  private async handleIssueCreate(args: any) {
    const parsed = IssueCreateSchema.parse(args);
    let command = `gh issue create --repo ${parsed.owner}/${parsed.repo} --title "${parsed.title}"`;
    
    if (parsed.body) {
      command += ` --body "${parsed.body}"`;
    }
    
    if (parsed.labels && parsed.labels.length > 0) {
      command += ` --label "${parsed.labels.join(',')}"`;
    }
    
    if (parsed.assignees && parsed.assignees.length > 0) {
      command += ` --assignee "${parsed.assignees.join(',')}"`;
    }

    const { stdout, stderr } = await execAsync(command);
    
    return {
      content: [{ type: "text", text: `Issue Created:\n${stdout}\n${stderr ? `Warnings:\n${stderr}` : ""}` }],
    };
  }

  private async handlePRList(args: any) {
    const parsed = PRListSchema.parse(args);
    let command = `gh pr list`;
    
    if (parsed.owner && parsed.repo) {
      command += ` --repo ${parsed.owner}/${parsed.repo}`;
    }
    
    command += ` --state ${parsed.state} --limit ${parsed.limit} --json number,title,state,author,createdAt,updatedAt,headRefName,baseRefName`;

    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && stderr.trim()) {
      throw new McpError(ErrorCode.InternalError, `GitHub CLI error: ${stderr}`);
    }

    return {
      content: [{ type: "text", text: `Pull Requests:\n${stdout}` }],
    };
  }

  private async handlePRCreate(args: any) {
    const parsed = PRCreateSchema.parse(args);
    let command = `gh pr create --repo ${parsed.owner}/${parsed.repo} --title "${parsed.title}" --head ${parsed.head} --base ${parsed.base}`;
    
    if (parsed.body) {
      command += ` --body "${parsed.body}"`;
    }
    
    if (parsed.draft) {
      command += " --draft";
    }

    const { stdout, stderr } = await execAsync(command);
    
    return {
      content: [{ type: "text", text: `Pull Request Created:\n${stdout}\n${stderr ? `Warnings:\n${stderr}` : ""}` }],
    };
  }

  private async handleWorkflowList(args: any) {
    const parsed = WorkflowListSchema.parse(args);
    const command = `gh workflow list --repo ${parsed.owner}/${parsed.repo} --json id,name,state`;

    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && stderr.trim()) {
      throw new McpError(ErrorCode.InternalError, `GitHub CLI error: ${stderr}`);
    }

    return {
      content: [{ type: "text", text: `Workflows:\n${stdout}` }],
    };
  }

  private async handleWorkflowRun(args: any) {
    const parsed = WorkflowRunSchema.parse(args);
    const command = `gh workflow run ${parsed.workflow} --repo ${parsed.owner}/${parsed.repo} --ref ${parsed.ref}`;

    const { stdout, stderr } = await execAsync(command);
    
    return {
      content: [{ type: "text", text: `Workflow Triggered:\n${stdout}\n${stderr ? `Info:\n${stderr}` : ""}` }],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("GitHub MCP server running on stdio");
  }
}

const server = new GitHubMCPServer();
server.run().catch(console.error);
