import React from 'react';
import CopyableCommand from './CopyableCommand';

const QuickStart = () => {
  return (
    <section id="quickstart" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-12 text-center text-gray-800">Quick Start</h2>
        <div className="bg-gray-50 rounded-lg shadow-md p-6">
          <h3 className="text-2xl font-semibold mb-4 text-gray-800">1. Configuring IAM to trust GitHub</h3>
          <p className="mb-4 text-gray-600">
            To use GitHub's OIDC provider, you must first set up federation with the provider as an IAM IdP. Here's a sample CloudFormation template that will configure this trust for you:
          </p>
          <CopyableCommand command={`Parameters:
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
          <p className="mb-4 text-gray-600">Add the following to your GitHub Actions workflow file:</p>
          <CopyableCommand command={`- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/role-name
    aws-region: us-east-1`} />

          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">3. Using Intelli-Ops GitHub Action</h3>
          <p className="mb-4 text-gray-600">Add the following to your workflow file:</p>
          <CopyableCommand command={`- name: Code review using AWS Bedrock
  uses: yike5460/intelli-ops@stable
  with:
    github-token: \${{ secrets.GITHUB_TOKEN }}
    aws-region: us-east-1
    model-id: anthropic.claude-3-sonnet-20240229-v1:0
    exclude-files: '*.md,*.json'
    review-level: 'concise'
    generate-pr-description: 'true'
  env:
    GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`} />

          <h3 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">4. Interacting with GitHub App</h3>
          <p className="mb-4 text-gray-600">You can interact with the GitHub App by commenting on pull requests. Here are some example commands:</p>
          <ul className="list-disc list-inside mb-4 text-gray-600">
            <li>@intellibotdemo generate interesting stats about this repository and render them as a table.</li>
            <li>@intellibotdemo show all the console.log statements in this repository.</li>
            <li>@intellibotdemo generate unit testing code for this file.</li>
            <li>@intellibotdemo read src/utils.ts and generate unit testing code.</li>
            <li>@intellibotdemo read the files in the src/scheduler package and generate a class diagram using mermaid and a README in the markdown format.</li>
            <li>@intellibotdemo modularize this function.</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default QuickStart;