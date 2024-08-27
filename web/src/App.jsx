import React from 'react';
import CopyableCommand from './components/CopyableCommand';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
      <Footer />

      <main className="container mx-auto px-4 py-8">
        {/* New Quick Start Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Quick Start</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-2">Configuring IAM to trust GitHub</h3>
            <p className="mb-4">
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
                token.actions.githubusercontent.com:sub: !Sub repo:${GitHubOrg}/${RepositoryName}:*

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

            <h3 className="text-xl font-semibold mt-6 mb-2">Configuring AWS Credentials</h3>
            <p className="mb-4">
              To configure GitHub Actions to assume the role you just created, add the following to your workflow file:
            </p>
            <CopyableCommand command={`- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/role-name
    aws-region: us-east-1`} />

            <h3 className="text-xl font-semibold mt-6 mb-2">Intelli-Ops GitHub Action Sample</h3>
            <p className="mb-4">Here's a basic usage example:</p>
            <CopyableCommand command={`- name: Code review using AWS Bedrock
  uses: yike5460/intelli-ops@stable
  with:
    github-token: \${{ secrets.GITHUB_TOKEN }}
    aws-region: us-east-1`} />

            <p className="mt-4 mb-2">And an advanced usage example:</p>
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
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;