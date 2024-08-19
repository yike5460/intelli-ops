# GitHub action using AWS Bedrock

## Overview

This GitHub Action performs automated code reviews, PR generation and issue operation etc. using AWS Bedrock API. It can be used to automatically review code changes in pull requests and provide feedback to developers. The action can be configured to exclude certain files from the review, set the level of detail for reviews, and generate PR descriptions. The action requires an AWS account and an IAM role with the necessary permissions to invoke AWS Bedrock.

## Security Recommendations

- Use GitHub's OIDC provider to authenticate with AWS instead of long-lived credentials.
- Ensure the IAM role used has the minimum necessary permissions to invoke AWS Bedrock.
- Regularly rotate any secrets used in the workflow.
- Use the latest version of this action to benefit from security updates.

## Configuring IAM to trust GitHub
To use GitHub's OIDC provider, you must first set up federation with the provider as an IAM IdP. The GitHub OIDC provider only needs to be created once per account (i.e. multiple IAM Roles that can be assumed by the GitHub's OIDC can share a single OIDC Provider). Here is a sample CloudFormation template that will configure this trust for you.

Note that the thumbprint below has been set to all F's because the thumbprint is not used when authenticating token.actions.githubusercontent.com. This is a special case used only when GitHub's OIDC is authenticating to IAM. IAM uses its library of trusted CAs to authenticate. The value is still the API, so it must be specified.

You can copy the template below, or load it from here: https://d38mtn6aq9zhn6.cloudfront.net/configure-aws-credentials-latest.yml
```yaml
Parameters:
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
    Value: !GetAtt Role.Arn 
```

You will see the role been create with trust relationship similar to the following, that string "repo:github-organization/github-repository" will limit the workflow action only been trigger by the specified respotories.

```json
{
  "Effect": "Allow",
  "Principal": {
    "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
    },
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:github-organization/github-repository:*"
    }
  }
}
```

## Configuring GitHub Actions

To configure GitHub Actions to assume the role you just created, you will need to add a workflow file to your repository. Here is an example workflow file that will assume the role you created above and run the code review action.

```yaml
    # assume the specified IAM role and set up the AWS credentials for use in subsequent steps.
    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::123456789012:role/role-name
        aws-region: us-east-1
```

## Options

| Option | Description | Default | Required |
| --- | --- | --- | --- |
| `github-token` | GitHub token for API access | N/A | Yes |
| `aws-region` | AWS region for Bedrock | us-east-1 | Yes |
| `model-id` | ID of the model to use for code reviews | `anthropic.claude-3-sonnet-20240229-v1:0` | Yes |
| `exclude-files` | Comma-separated list of file patterns to exclude | N/A | No |
| `review-level` | Level of detail for reviews ('detailed' or 'concise') | `'concise'` | No |
| `code-review` | Whether to perform code reviews | `'false'` | No |
| `generate-pr-description` | Whether to generate PR descriptions | `'false'` | No |
| `generate-unit-test-suite` | Whether to generate unit test suite | `'false'` | No |

## Example

**Basic Usage**

```yaml
- name: Code review using AWS Bedrock
  uses: yike5460/intelli-ops@v0.0.8
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    aws-region: us-east-1
```

**Advanced Usage**

```yaml
- name: Code review using AWS Bedrock
    uses: yike5460/intelli-ops@v0.0.8
    with:
    # Automatic Provision: The GITHUB_TOKEN is automatically created and provided by GitHub for each workflow run. You don't need to manually create or store this token as a secret.
    github-token: ${{ secrets.GITHUB_TOKEN }}
    aws-region: us-east-1
    model-id: anthropic.claude-3-sonnet-20240229-v1:0
    exclude-files: '*.md,*.json'
    review-level: 'concise'
    generate-pr-description: 'true'
    env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```


## Authenticating AWS Credentials in GitHub Actions
The [document](https://github.com/aws-actions/configure-aws-credentials) outlines five different methods for retrieving AWS credentials, each with its own use case. Here's a brief overview of each method:

1. GitHub's OIDC provider (Recommended):

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789100:role/my-github-actions-role
    aws-region: us-east-1
```

2. IAM User:

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1
```

3. Assume Role using IAM User credentials:

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1
    role-to-assume: arn:aws:iam::123456789100:role/my-github-actions-role
```

4. Assume Role using WebIdentity Token File credentials:

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789100:role/my-github-actions-role
    aws-region: us-east-1
    web-identity-token-file: /path/to/token/file
```

5. Assume Role using existing credentials:

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789100:role/my-github-actions-role
    aws-region: us-east-1
    role-chaining: true
```

## Handy commands to release the action

```bash
version = "0.0.31"
git tag -a $version -m "Release version $version"
git push origin $version
gh release create $version -t "$version" -n ""
```

Key differences:

1. GitHub's OIDC provider is the recommended method as it uses short-lived credentials and doesn't require storing long-term secrets.
2. IAM User method uses long-term credentials, which is less secure but simpler to set up.
3. Assuming a role with IAM User credentials adds an extra layer of security by using temporary credentials.
4. WebIdentity Token File method is useful for scenarios like Amazon EKS IRSA.
5. Using existing credentials with role chaining is helpful when you already have AWS credentials in your environment and want to assume a different role.

## License Summary
This project is licensed under Apache 2.0 License. See the LICENSE file for details.

## TODO
- support issue operation with code source and search api
- observe the action operation metrics
- better ut case generation with preflight execution 
- support chinese