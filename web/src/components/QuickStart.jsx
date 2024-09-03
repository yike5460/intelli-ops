import React, { useState } from 'react';
import CopyableCommand from './CopyableCommand';

const FoldableCommand = ({ title, command }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="mt-2">
          <CopyableCommand command={command} />
        </div>
      )}
    </div>
  );
};

const QuickStart = () => {
  return (
    <section id="quickstart" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="relative mb-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center">
            <h2 className="text-4xl font-bold px-4 bg-white text-gray-800">
              Quick Start
            </h2>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg shadow-md p-6">
          <h3 className="text-2xl font-semibold mb-4 text-gray-800">1. Configuring IAM to trust GitHub</h3>
          <p className="mb-4 text-gray-600">
            To use GitHub's OIDC provider, you must first set up federation with the provider as an IAM IdP. Here's a CloudFormation template that will configure this trust for you, you can just copy or load it from <a href="https://d38mtn6aq9zhn6.cloudfront.net/configure-aws-credentials-latest.yml" className="underline">HERE</a>:
          </p>
          <FoldableCommand title="CloudFormation Template" command={`Parameters:
  GitHubOrg:
    Description: Name of GitHub organization/user (case sensitive)
    Type: String
  RepositoryName:
    Description: Name of GitHub repository (case sensitive)
    Type: String
  OIDCProviderArn:
    Description: Arn for the GitHub OIDC Provider.
    Default: ""
    Type: String
  OIDCAudience:
    Description: Audience supplied to configure-aws-credentials.
    Default: "sts.amazonaws.com"
    Type: String

Conditions:
  CreateOIDCProvider: !Equals 
    - !Ref OIDCProviderArn
    - ""

Resources:
  Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Action: sts:AssumeRoleWithWebIdentity
            Principal:
              Federated: !If 
                - CreateOIDCProvider
                - !Ref GithubOidc
                - !Ref OIDCProviderArn
            Condition:
              StringEquals:
                token.actions.githubusercontent.com:aud: !Ref OIDCAudience
              StringLike:
                token.actions.githubusercontent.com:sub: !Sub repo:\${GitHubOrg}/\${RepositoryName}:*

  GithubOidc:
    Type: AWS::IAM::OIDCProvider
    Condition: CreateOIDCProvider
    Properties:
      Url: https://token.actions.githubusercontent.com
      ClientIdList: 
        - sts.amazonaws.com
      ThumbprintList:
        - ffffffffffffffffffffffffffffffffffffffff

Outputs:
  Role:
    Value: !GetAtt Role.Arn`} />

          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">2. Configuring AWS Credentials</h3>
          <p className="mb-4 text-gray-600">Add the following to your GitHub Actions workflow file, note to replace the role-to-assume with the role you created in the previous step:</p>
          <FoldableCommand title="AWS Credentials Configuration" command={`- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/role-name
    aws-region: us-east-1`} />

          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">3. Clone and Publish the Action</h3>
          <p className="mb-4 text-gray-600">Before using the Intelli-Ops GitHub Action, you need to clone the repository and publish a release:</p>
          <FoldableCommand title="Clone and Publish the Action" command={`git clone https://github.com/yike5460/intelli-ops.git
cd intelli-ops
version="stable"
git tag -a $version -m "Release version $version"
git push origin $version
gh release create $version -t "$version" -n ""`} />
          <p className="mt-2 mb-4 text-gray-600">Make sure to replace "your-username" with your actual GitHub username and adjust the version number as needed.</p>

          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">4. Using Intelli-Ops GitHub Action</h3>
          <p className="mb-4 text-gray-600">After publishing the release, add the following to your workflow file:</p>
          <FoldableCommand title="Using Intelli-Ops GitHub Action" command={`- name: Code review using AWS Bedrock
  uses: your-username/intelli-ops@0.0.31
  with:
    github-token: \${{ secrets.GITHUB_TOKEN }}
    aws-region: us-east-1
    model-id: anthropic.claude-3-sonnet-20240229-v1:0
    exclude-files: '*.md,*.json'
    review-level: 'concise'
    generate-pr-description: 'true'
  env:
    GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`} />
          <p className="mt-2 mb-4 text-gray-600">Remember to replace "your-username" with your GitHub username and adjust the version number if necessary.</p>

          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">5. Full Workflow Sample</h3>
          <p className="mb-4 text-gray-600">Here's a complete workflow sample that you can use as a reference:</p>
          <FoldableCommand title="Full Workflow Sample" command={`name: Intelligent Code Review
on:
  workflow_dispatch:
  pull_request:
    types: [opened, synchronize]

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: write
      pull-requests: write
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'

    - name: Install dependencies @actions/core and @actions/github
      run: |
        npm install @actions/core
        npm install @actions/github
      shell: bash

    - name: Check if required dependencies are installed
      run: |
        npm list @actions/core
        npm list @actions/github
      shell: bash

    - name: Debug GitHub Token
      run: |
        if [ -n "\${{ secrets.GITHUB_TOKEN }}" ]; then
          echo "GitHub Token is set"
        else
          echo "GitHub Token is not set"
        fi

    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::123456789012:role/role-name
        aws-region: us-east-1

    - name: Intelligent GitHub Actions
      uses: yike5460/intelli-ops@stable
      with:
        github-token: \${{ secrets.GITHUB_TOKEN }}
        aws-region: us-east-1
        model-id: anthropic.claude-3-sonnet-20240229-v1:0
        exclude-files: '*.md,*.json,*.yml,*.yaml'
        review-level: 'concise'
        code-review: 'true'
        generate-pr-description: 'true'
        generate-unit-test-suite: 'true'
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`} />
          <p className="mt-2 mb-4 text-gray-600">Make sure to replace the `role-to-assume` ARN with your actual IAM role ARN.</p>

          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">6. Starting the GitHub App Server</h3>
          <p className="mb-4 text-gray-600">Before interacting with the GitHub App, you need to start the server that handles user requests:</p>
          <FoldableCommand title="Starting the GitHub App Server" command={`cd app
npm install
npm run start`} />
          <p className="mt-2 mb-4 text-gray-600">
            This will start the server locally. For a more stable user experience, consider hosting the code as a container or daemon process in a separate infrastructure.
          </p>

          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">7. Interacting with GitHub App</h3>
          <p className="mb-4 text-gray-600">Once the server is running, you can interact with the GitHub App by commenting on pull requests. Here are some example commands:</p>
          <ul className="list-disc list-inside mb-4 text-gray-600">
            <li>@intellibotdemo generate interesting stats about this repository and render them as a table.</li>
            <li>@intellibotdemo show all the console.log statements in this repository.</li>
            <li>@intellibotdemo generate unit testing code for this file.</li>
            <li>@intellibotdemo read src/utils.ts and generate unit testing code.</li>
            <li>@intellibotdemo read the files in the src/scheduler package and generate a class diagram using mermaid and a README in the markdown format.</li>
            <li>@intellibotdemo modularize this function.</li>
          </ul>
          <p className="mt-2 mb-4 text-gray-600">
            Note: Ensure that your GitHub App is properly configured and has the necessary permissions to interact with your repository.
          </p>

        </div>
      </div>
    </section>
  );
};

export default QuickStart;